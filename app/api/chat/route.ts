import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { buildSystemPrompt, AITheme } from '@/lib/gemini';
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
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-api-key-here') {
    return new Response(
      JSON.stringify({ error: 'API key chưa được cấu hình.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { message, history, car, theme, sessionId, attachments } = (await request.json()) as {
      message: string;
      history: { role: 'user' | 'model'; parts: { text: string }[] }[];
      car?: CarProfile;
      theme: AITheme;
      sessionId?: string;       // DB session ID if logged in
      attachments?: Attachment[];
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const systemPrompt = buildSystemPrompt(theme, car);

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemPrompt,
    });

    // Build message parts (text + optional attachments)
    const parts: Part[] = [{ text: message }];

    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        try {
          // Read file from disk
          const relPath = att.url.replace('/uploads/', '');
          const filePath = join(process.cwd(), 'public', 'uploads', relPath);
          const fileData = await readFile(filePath);
          const base64 = fileData.toString('base64');

          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: base64,
            },
          } as Part);
        } catch {
          // If file read fails, just add a text note
          parts.push({ text: `[Đính kèm: ${att.name}]` });
        }
      }
    }

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(parts);

    // Accumulate full response for DB storage
    let fullResponse = '';
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();

          // Save to DB if user is logged in and sessionId provided
          if (userId && sessionId) {
            try {
              // Save user message
              await db.chatMessage.create({
                data: {
                  sessionId,
                  role: 'user',
                  content: message,
                  attachments: attachments ? JSON.stringify(attachments) : null,
                },
              });
              // Save AI response
              await db.chatMessage.create({
                data: {
                  sessionId,
                  role: 'assistant',
                  content: fullResponse,
                },
              });
              // Update session timestamp + auto-title from first message
              const msgCount = await db.chatMessage.count({ where: { sessionId } });
              if (msgCount <= 2) {
                const title = message.length > 50
                  ? message.slice(0, 50) + '...'
                  : message;
                await db.chatSession.update({
                  where: { id: sessionId },
                  data: { title, updatedAt: new Date() },
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
    console.error('Chat API error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const isQuota = errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Too Many Requests');
    return new Response(
      JSON.stringify({
        error: isQuota
          ? 'quota: Gemini API rate limit — thử lại sau 30 giây.'
          : 'Có lỗi khi kết nối AI. Vui lòng thử lại.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
