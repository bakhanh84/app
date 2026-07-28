import { NextRequest, NextResponse } from 'next/server';
import webPush from 'web-push';
import { db } from '@/lib/db';

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BNQnoWjv53en9R-aDsgMKhel0kAGpu4hlWvGE3FM_YBjqw1tLKF9gOES2jbIfRcvfsTk3m3Ak0lEd6K6Xd-giVU';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'CZALzeY7TB-cxQ_xMPmGL-fMwTWIvIwY5z2U9InZWcU';

webPush.setVapidDetails(
  'mailto:support@sparkgo.vn',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, title, body, url } = await req.json();

    const payload = JSON.stringify({
      title: title || '⚡ SparkGo — Nhắc Lịch Bảo Dưỡng',
      body: body || 'Đến lịch thay dầu động cơ và kiểm tra xe của bạn!',
      url: url || '/calendar',
    });

    if (subscription) {
      await webPush.sendNotification(subscription, payload);
    } else {
      // Find all reminders in DB needing notification
      const reminders = await db.maintenanceReminder.findMany({
        where: { notified: false, pushSubscription: { not: null } },
      });

      for (const rem of reminders) {
        if (rem.pushSubscription) {
          try {
            const sub = JSON.parse(rem.pushSubscription);
            await webPush.sendNotification(sub, payload);
            await db.maintenanceReminder.update({
              where: { id: rem.id },
              data: { notified: true },
            });
          } catch (e) {
            console.error('Error sending push to:', rem.id, e);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Push send error:', err);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
