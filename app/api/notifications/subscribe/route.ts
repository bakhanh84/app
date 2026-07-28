import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;

  const { subscription, carId } = await req.json();

  if (!subscription) {
    return NextResponse.json({ error: 'Subscription missing' }, { status: 400 });
  }

  if (userId && carId) {
    // Save to DB
    await db.maintenanceReminder.create({
      data: {
        userId,
        carId,
        type: 'custom',
        label: 'Thông báo bảo dưỡng định kỳ',
        pushSubscription: JSON.stringify(subscription),
      },
    });
  }

  return NextResponse.json({ ok: true, message: 'Đã đăng ký nhận thông báo thành công!' });
}
