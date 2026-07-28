import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/sessions — danh sách chat sessions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('id');

  if (sessionId) {
    // Get one session with messages
    const chatSession = await db.chatSession.findUnique({
      where: { id: sessionId, userId: session.user.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        car: true,
      },
    });
    return NextResponse.json(chatSession);
  }

  const carId = searchParams.get('carId');

  // List all sessions (filtered by carId if provided)
  const sessions = await db.chatSession.findMany({
    where: {
      userId: session.user.id,
      ...(carId ? { carId } : {}),
    },
    include: {
      car: { select: { id: true, brand: true, model: true, year: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: 'asc' },
        select: { content: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });

  return NextResponse.json(sessions);
}

// POST /api/sessions — tạo session mới
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { carId, theme } = await req.json();

  const chatSession = await db.chatSession.create({
    data: {
      userId: session.user.id,
      carId: carId || null,
      theme: theme || 'pro',
      title: 'Cuộc trò chuyện mới',
    },
  });
  return NextResponse.json(chatSession);
}

// PATCH /api/sessions — update title
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, title } = await req.json();
  const updated = await db.chatSession.update({
    where: { id, userId: session.user.id },
    data: { title, updatedAt: new Date() },
  });
  return NextResponse.json(updated);
}

// DELETE /api/sessions?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  await db.chatSession.delete({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
