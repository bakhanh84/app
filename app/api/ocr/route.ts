import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';


const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { imageUrl, imageBase64, mimeType, carId } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key configured' }, { status: 500 });

  // Build image part for Gemini
  let imagePart: any;
  if (imageBase64 && mimeType) {
    imagePart = {
      inlineData: { data: imageBase64, mimeType },
    };
  } else if (imageUrl) {
    // Fetch image and convert to base64
    const imageRes = await fetch(imageUrl);
    const arrayBuffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mime = imageRes.headers.get('content-type') || 'image/jpeg';
    imagePart = {
      inlineData: { data: base64, mimeType: mime },
    };
  } else {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const prompt = `Bạn là AI đọc hóa đơn sửa chữa xe ô tô tại Việt Nam. 
  
Hãy đọc ảnh hóa đơn/biên lai/báo giá này và trích xuất thông tin theo format JSON sau:

{
  "docType": "invoice|quote|receipt|other",
  "garageOrShop": "tên garage/shop",
  "date": "YYYY-MM-DD hoặc DD/MM/YYYY",
  "totalAmount": số tiền tổng (chỉ số, không có đơn vị),
  "currency": "VND",
  "odometerKm": số km nếu có (null nếu không có),
  "services": [
    {
      "name": "tên dịch vụ/hạng mục",
      "type": "maintenance|repair|parts|inspection|other",
      "quantity": số lượng nếu có,
      "unitPrice": đơn giá nếu có,
      "totalPrice": thành tiền,
      "notes": "ghi chú nếu có"
    }
  ],
  "parts": [
    {
      "name": "tên phụ tùng",
      "brand": "thương hiệu nếu biết",
      "quantity": số lượng,
      "price": giá
    }
  ],
  "summary": "Tóm tắt ngắn gọn về hóa đơn này bằng tiếng Việt (1-2 câu)",
  "confidence": "high|medium|low",
  "notes": "các thông tin quan trọng khác từ hóa đơn"
}

Nếu không thể đọc được thông tin nào, trả về null cho field đó.
Trả về JSON thuần túy, không có markdown code block.`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            imagePart,
            { text: prompt },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json();
      return NextResponse.json({ error: err.error?.message || 'Gemini error' }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let extractedData: any = null;
    try {
      // Remove potential markdown code blocks
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      extractedData = JSON.parse(cleaned);
    } catch {
      // If parse fails, return raw text
      extractedData = { raw: rawText, confidence: 'low', summary: 'Không thể đọc hóa đơn tự động.' };
    }

    // If carId provided, save as VehicleDocument and VehicleMemory
    if (carId && extractedData) {
      try {
        // Save to VehicleDocument
        if (imageUrl) {
          await db.vehicleDocument.create({
            data: {
              carId,
              userId: user.id,
              docType: extractedData.docType || 'invoice',
              fileName: `receipt-${Date.now()}`,
              url: imageUrl,
              extractedData: JSON.stringify(extractedData),
            },
          });
        }

        // Auto-create VehicleMemory from extracted data
        if (extractedData.services && extractedData.services.length > 0) {
          const serviceNames = extractedData.services.map((s: any) => s.name).join(', ');
          await db.vehicleMemory.create({
            data: {
              carId,
              userId: user.id,
              memoryType: 'repair',
              title: extractedData.garageOrShop
                ? `Hóa đơn từ ${extractedData.garageOrShop}`
                : 'Hóa đơn sửa chữa',
              content: JSON.stringify({
                ...extractedData,
                autoSaved: true,
              }),
              source: 'upload',
              severity: 'info',
              date: extractedData.date ? new Date(extractedData.date) : new Date(),
            },
          });
        }

        // Update car totalCost
        if (extractedData.totalAmount && typeof extractedData.totalAmount === 'number') {
          await db.car.update({
            where: { id: carId },
            data: {
              totalCost: { increment: extractedData.totalAmount },
            },
          });
        }
      } catch (dbErr) {
        console.error('DB save error:', dbErr);
      }
    }

    return NextResponse.json({ success: true, data: extractedData });
  } catch (err) {
    console.error('OCR error:', err);
    return NextResponse.json({ error: 'Lỗi xử lý ảnh' }, { status: 500 });
  }
}
