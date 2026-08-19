import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';


export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const carId = searchParams.get('carId');
  const type = searchParams.get('type');

  const where: any = { userId: user.id };
  if (carId) where.carId = carId;
  if (type) where.memoryType = type;

  const memories = await db.vehicleMemory.findMany({
    where,
    orderBy: { date: 'desc' },
    take: 50,
  });

  return NextResponse.json(memories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const body = await req.json();
  const { carId, memoryType, title, content, source, severity, date } = body;

  if (!carId || !memoryType || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const memory = await db.vehicleMemory.create({
    data: {
      carId,
      userId: user.id,
      memoryType,
      title,
      content: content || '',
      source: source || 'manual',
      severity: severity || 'info',
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update car profile completeness after adding memory
  await updateCarCompleteness(carId);


  return NextResponse.json(memory);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await db.vehicleMemory.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

async function updateCarCompleteness(carId: string) {
  const car = await db.car.findUnique({ where: { id: carId } });
  if (!car) return;

  const memories = await db.vehicleMemory.count({ where: { carId } });
  const docs = await db.vehicleDocument.count({ where: { carId } });
  const services = await db.serviceRecord.count({ where: { carId } });

  let score = 10; // base
  if (car.brand && car.model) score += 10;
  if (car.year) score += 5;
  if (car.currentKm > 0) score += 10;
  if (car.licensePlate) score += 5;
  if (car.vin) score += 5;
  if (car.fuelType) score += 5;
  if (car.lastOilChangeKm) score += 10;
  if (services > 0) score += Math.min(services * 5, 15);
  if (memories > 0) score += Math.min(memories * 3, 15);
  if (docs > 0) score += Math.min(docs * 2, 10);
  if (car.insuranceExpiry) score += 5;
  if (car.registrationExpiry) score += 5;

  score = Math.min(score, 100);

  await db.car.update({
    where: { id: carId },
    data: { profileComplete: score },
  });
}
