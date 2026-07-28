import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/services?carId=xxx — Lấy danh sách lịch sử làm dịch vụ/thay đồ của xe
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const carId = searchParams.get('carId');

  const records = await db.serviceRecord.findMany({
    where: {
      userId: session.user.id,
      ...(carId ? { carId } : {}),
    },
    orderBy: { serviceDate: 'desc' },
    include: { car: { select: { brand: true, model: true, licensePlate: true } } },
  });

  return NextResponse.json(records);
}

// POST /api/services — Thêm nhật ký làm dịch vụ/bảo dưỡng
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { carId, serviceName, odometerKm, serviceDate, garageName, cost, invoiceUrl, notes } = body;

  if (!carId || !serviceName || !odometerKm) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (carId, serviceName, odometerKm)' }, { status: 400 });
  }

  const record = await db.serviceRecord.create({
    data: {
      userId: session.user.id,
      carId,
      serviceName,
      odometerKm: parseInt(odometerKm),
      serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
      garageName: garageName || null,
      cost: cost ? parseFloat(cost) : null,
      invoiceUrl: invoiceUrl || null,
      notes: notes || null,
    },
  });

  // Also update car's currentKm if odometerKm > car.currentKm
  const car = await db.car.findUnique({ where: { id: carId } });
  if (car && parseInt(odometerKm) > car.currentKm) {
    await db.car.update({
      where: { id: carId },
      data: {
        currentKm: parseInt(odometerKm),
        ...(serviceName.toLowerCase().includes('dầu') ? {
          lastOilChangeKm: parseInt(odometerKm),
          lastOilChangeDate: new Date().toISOString().split('T')[0],
        } : {}),
      },
    });
  }

  return NextResponse.json(record);
}
