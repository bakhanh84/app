import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { buildSystemPrompt, buildIntelligentAutomotiveResponse, AITheme } from '@/lib/gemini';
import { CarProfile } from '@/lib/maintenance';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface Attachment {
  url: string;
  name: string;
  type: string;
  mimeType: string;
  base64?: string;
}

const CANDIDATE_MODELS = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
];

export async function POST(request: Request) {
  const reqJson = await request.json().catch(() => ({}));
  const { message, history, car, theme, sessionId, attachments, customApiKey } = reqJson as {
    message: string;
    history: { role: 'user' | 'model'; parts: { text: string }[] }[];
    car?: CarProfile;
    theme: AITheme;
    sessionId?: string;
    attachments?: Attachment[];
    customApiKey?: string;
  };

  const apiKey = customApiKey || process.env.GEMINI_API_KEY;

  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Build message parts
    const parts: Part[] = [{ text: message || '' }];

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        let base64Data = att.base64;

        if (!base64Data && att.url && att.url.startsWith('data:')) {
          const p = att.url.split(',');
          if (p.length > 1) base64Data = p[1];
        }

        if (!base64Data && att.url && att.url.startsWith('/uploads/')) {
          try {
            const relPath = att.url.replace('/uploads/', '');
            const filePath = join(process.cwd(), 'public', 'uploads', relPath);
            const fileData = await readFile(filePath);
            base64Data = fileData.toString('base64');
          } catch {}
        }

        if (base64Data) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64Data,
            },
          } as Part);
        } else {
          parts.push({ text: `[Đính kèm: ${att.name}]` });
        }
      }
    }

    // Try API models in sequence if valid API key exists
    let resultStream: AsyncIterable<{ text: () => string }> | null = null;

    if (apiKey && apiKey.trim().length > 10) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const systemPrompt = buildSystemPrompt(theme, car);

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
          });
          const chat = model.startChat({ history: history || [] });
          const res = await chat.sendMessageStream(parts);
          resultStream = res.stream;
          break;
        } catch (err: any) {
          console.warn(`Model ${modelName} call failed:`, err?.status || err?.message);
        }
      }
    }

    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (resultStream) {
            for await (const chunk of resultStream) {
              const text = chunk.text();
              if (text) {
                fullResponse += text;
                controller.enqueue(encoder.encode(text));
              }
            }
          } else {
            // Context-Aware Automotive Expert Engine
            const fallbackText = buildIntelligentAutomotiveResponse(message || '', car, theme);
            const words = fallbackText.split(' ');

            for (let i = 0; i < words.length; i++) {
              const word = (i === 0 ? '' : ' ') + words[i];
              fullResponse += word;
              controller.enqueue(encoder.encode(word));
              await new Promise(resolve => setTimeout(resolve, 20));
            }
          }
        } catch (streamErr) {
          console.error('Stream processing error:', streamErr);
          if (!fullResponse) {
            const fallbackText = buildIntelligentAutomotiveResponse(message || '', car, theme);
            fullResponse = fallbackText;
            controller.enqueue(encoder.encode(fallbackText));
          }
        } finally {
          controller.close();

          // Save to DB if logged in
          if (userId && sessionId && fullResponse) {
            try {
              await db.chatMessage.create({
                data: {
                  sessionId,
                  role: 'user',
                  content: message || '',
                  attachments: attachments ? JSON.stringify(attachments) : null,
                },
              });
              await db.chatMessage.create({
                data: {
                  sessionId,
                  role: 'assistant',
                  content: fullResponse,
                },
              });
              const msgCount = await db.chatMessage.count({ where: { sessionId } });
              if (msgCount <= 2) {
                const title = (message || '').length > 50 ? (message || '').slice(0, 50) + '...' : message;
                await db.chatSession.update({
                  where: { id: sessionId },
                  data: {
                    title,
                    updatedAt: new Date(),
                    ...(car?.id ? { carId: car.id } : {}),
                  },
                });
              } else {
                await db.chatSession.update({
                  where: { id: sessionId },
                  data: { updatedAt: new Date() },
                });
              }
            } catch (dbErr) {
              console.error('DB save error:', dbErr);
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    console.error('Chat API general error:', err);
    return new Response(
      JSON.stringify({ error: 'Có lỗi xảy ra. Vui lòng thử lại.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
