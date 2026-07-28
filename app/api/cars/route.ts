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
  const { id, brand, model, year, currentKm, fuelType, transmission, color, lastOilChangeKm, lastOilChangeDate, notes, licensePlate } = body;

  if (!brand || !model) {
    return NextResponse.json({ error: 'Thiếu thông tin hãng hoặc dòng xe' }, { status: 400 });
  }

  // Check if car with same brand/model already exists for user
  const existingCar = id
    ? await db.car.findFirst({ where: { id, userId: session.user.id } })
    : await db.car.findFirst({ where: { userId: session.user.id, brand, model, isActive: true } });

  if (existingCar) {
    const updated = await db.car.update({
      where: { id: existingCar.id },
      data: {
        year: year || existingCar.year,
        currentKm: currentKm !== undefined ? currentKm : existingCar.currentKm,
        fuelType: fuelType || existingCar.fuelType,
        transmission: transmission || existingCar.transmission,
        color: color !== undefined ? color : existingCar.color,
        lastOilChangeKm: lastOilChangeKm !== undefined ? lastOilChangeKm : existingCar.lastOilChangeKm,
        lastOilChangeDate: lastOilChangeDate !== undefined ? lastOilChangeDate : existingCar.lastOilChangeDate,
        notes: notes !== undefined ? notes : existingCar.notes,
        licensePlate: licensePlate !== undefined ? licensePlate : existingCar.licensePlate,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  } else {
    // Check max 5 cars limit
    const currentCarsCount = await db.car.count({
      where: { userId: session.user.id, isActive: true },
    });

    if (currentCarsCount >= 5) {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đã đạt giới hạn tối đa 5 xe ô tô. Vui lòng xóa bớt xe cũ để thêm xe mới.' },
        { status: 400 }
      );
    }

    const newCar = await db.car.create({

      data: {
        userId: session.user.id,
        brand,
        model,
        year: year || new Date().getFullYear(),
        currentKm: currentKm || 0,
        fuelType: fuelType || 'petrol',
        transmission: transmission || 'auto',
        color,
        lastOilChangeKm,
        lastOilChangeDate,
        notes,
        licensePlate,
      },
    });
    return NextResponse.json(newCar);
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
