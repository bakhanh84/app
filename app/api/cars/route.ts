import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/cars — lấy danh sách xe của user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cars = await db.car.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json(cars);
}

// POST /api/cars — tạo/cập nhật xe
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const { id, ...data } = body;

  if (id) {
    // Update existing
    const car = await db.car.update({
      where: { id, userId: session.user.id },
      data: { ...data, updatedAt: new Date() },
    });
    return NextResponse.json(car);
  } else {
    // Create new
    const car = await db.car.create({
      data: { ...data, userId: session.user.id },
    });
    return NextResponse.json(car);
  }
}

// DELETE /api/cars?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.car.update({
    where: { id, userId: session.user.id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
