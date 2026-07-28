import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/stats — Thống kê tổng quan dữ liệu hệ thống SparkGo
export async function GET(req: NextRequest) {
  const session = await auth();

  // Basic check: user must be logged in
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [totalUsers, totalCars, totalSessions, totalMessages, recentUsers, recentCars] = await Promise.all([
      db.user.count(),
      db.car.count({ where: { isActive: true } }),
      db.chatSession.count(),
      db.chatMessage.count(),
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          _count: { select: { cars: true, chatSessions: true } },
        },
      }),
      db.car.findMany({
        take: 10,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    return NextResponse.json({
      summary: {
        totalUsers,
        totalCars,
        totalSessions,
        totalMessages,
      },
      recentUsers,
      recentCars,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi truy vấn cơ sở dữ liệu' }, { status: 500 });
  }
}
