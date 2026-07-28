'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { calculateMaintenance, CarProfile, MaintenanceItem } from '@/lib/maintenance';
import { AITheme } from '@/lib/gemini';

export default function CalendarPage() {
  const [car, setCar] = useState<CarProfile | null>(null);
  const [theme, setTheme] = useState<AITheme>('pro');
  const [items, setItems] = useState<MaintenanceItem[]>([]);
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('sparkgo_theme') as AITheme | null;
    if (savedTheme) setTheme(savedTheme);

    const savedCar = localStorage.getItem('sparkgo_car');
    if (savedCar) {
      const parsed: CarProfile = JSON.parse(savedCar);
      setCar(parsed);
      setCurrentKm(parsed.currentKm);
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setPushSubscribed(true);
        });
      });
    }
  }, []);

  useEffect(() => {
    if (car) {
      const updatedCar = { ...car, currentKm };
      setItems(calculateMaintenance(updatedCar));
    }
  }, [car, currentKm]);

  const enableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ Push Notifications.');
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Bạn đã từ chối quyền thông báo. Vui lòng cho phép trong cài đặt trình duyệt.');
        setIsSubscribing(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        const vapidPublicKey = 'BNQnoWjv53en9R-aDsgMKhel0kAGpu4hlWvGE3FM_YBjqw1tLKF9gOES2jbIfRcvfsTk3m3Ak0lEd6K6Xd-giVU';
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidPublicKey,
        });
      }

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });

      setPushSubscribed(true);

      // Send test notification
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          title: '⚡ SparkGo — Đã bật thông báo!',
          body: 'Bạn sẽ nhận được thông báo khi xe sắp đến lịch bảo dưỡng.',
        }),
      });

      alert('🔔 Đã bật nhắc nhở thành công!');
    } catch (err) {
      console.error(err);
      alert('Không thể bật thông báo. Vui lòng thử lại.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const counts = {
    overdue: items.filter(i => i.urgency === 'overdue').length,
    soon: items.filter(i => i.urgency === 'soon').length,
    upcoming: items.filter(i => i.urgency === 'upcoming').length,
    ok: items.filter(i => i.urgency === 'ok').length,
  };

  const urgencyLabel: Record<MaintenanceItem['urgency'], string> = {
    overdue: 'Quá hạn',
    soon: 'Sắp đến',
    upcoming: 'Sắp tới',
    ok: 'Ổn',
  };
  const urgencyIcon: Record<MaintenanceItem['urgency'], string> = {
    overdue: '🚨',
    soon: '⚠️',
    upcoming: '🔔',
    ok: '✅',
  };

  const handleItemClick = (item: MaintenanceItem) => {
    const question = `Hãy giải thích về việc ${item.name} cho xe của tôi. Hiện tại xe đang ở ${currentKm.toLocaleString('vi-VN')} km, hạng mục này ${item.urgency === 'overdue' ? 'đã quá hạn' : item.urgency === 'soon' ? 'sắp đến hạn' : 'đến hạn trong ' + Math.abs(item.daysUntilDue) + ' ngày nữa'}.`;
    localStorage.setItem('sparkgo_pending_question', question);
    window.location.href = '/chat';
  };

  if (!car) {
    return (
      <>
        <nav className="navbar">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">⚡</div>
            Spark<span>Go</span>
          </Link>
        </nav>
        <div style={{ paddingTop: 'var(--nav-height)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="no-car-state animate-fadeInUp">
            <div className="no-car-emoji">📅</div>
            <div className="no-car-title">Chưa có hồ sơ xe</div>
            <div className="no-car-desc">
              Thêm thông tin xe để xem lịch bảo dưỡng tự động tính theo km và thời gian.
            </div>
            <Link href="/onboarding" className="btn btn-primary btn-lg">
              🚗 Tạo hồ sơ xe ngay
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">⚡</div>
            Spark<span>Go</span>
          </Link>
        </div>
        <div className="navbar-actions">
          <button
            onClick={enableNotifications}
            className={`btn ${pushSubscribed ? 'btn-outline' : 'btn-primary'} btn-sm`}
            disabled={isSubscribing}
          >
            {pushSubscribed ? '🔔 Đã bật nhắc nhở' : '🔔 Bật nhắc nhở bảo dưỡng'}
          </button>
          <Link href="/chat" className="btn btn-primary btn-sm">🤖 Hỏi AI</Link>
        </div>
      </nav>

      <div className="calendar-page">
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-header-content">
            <div className="calendar-title">📅 Lịch Bảo Dưỡng</div>
            <div className="calendar-subtitle">
              {car.brand} {car.model} {car.year} — Cập nhật tự động theo km
            </div>

            <div className="km-input-row">
              <span className="km-input-label">Số km hiện tại:</span>
              <input
                className="km-input"
                type="number"
                value={currentKm}
                onChange={e => setCurrentKm(parseInt(e.target.value) || 0)}
                min={0}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>km</span>
            </div>
          </div>
        </div>

        <div className="calendar-content">
          {/* Summary */}
          <div className="calendar-summary">
            <div className="summary-pill overdue">
              <div className="summary-num">{counts.overdue}</div>
              <div className="summary-label">🚨 Quá hạn</div>
            </div>
            <div className="summary-pill soon">
              <div className="summary-num">{counts.soon}</div>
              <div className="summary-label">⚠️ Sắp đến</div>
            </div>
            <div className="summary-pill upcoming">
              <div className="summary-num">{counts.upcoming}</div>
              <div className="summary-label">🔔 Sắp tới</div>
            </div>
            <div className="summary-pill ok">
              <div className="summary-num">{counts.ok}</div>
              <div className="summary-label">✅ Ổn</div>
            </div>
          </div>

          {/* Info */}
          {counts.overdue > 0 && (
            <div style={{
              background: 'var(--danger-muted)',
              border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 18px',
              fontSize: '0.87rem',
              color: 'var(--danger)',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <span>Bạn có <strong>{counts.overdue}</strong> hạng mục đã quá hạn! Nhấn vào từng mục để hỏi AI về cách xử lý.</span>
            </div>
          )}

          {/* Items */}
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`maintenance-item ${item.urgency} animate-fadeInUp`}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => handleItemClick(item)}
              title="Nhấn để hỏi AI về hạng mục này"
            >
              <div className="maintenance-icon">{item.icon}</div>
              <div className="maintenance-info">
                <div className="maintenance-name">{item.name}</div>
                <div className="maintenance-desc">{item.description}</div>
              </div>
              <div className="maintenance-status">
                <div className={`maintenance-badge ${item.urgency}`}>
                  {urgencyIcon[item.urgency]} {urgencyLabel[item.urgency]}
                </div>
                <div className="maintenance-km">
                  {item.kmUntilDue > 0 && item.kmUntilDue < 999999
                    ? `còn ${item.kmUntilDue.toLocaleString('vi-VN')} km`
                    : item.kmUntilDue < 0
                    ? `quá ${Math.abs(item.kmUntilDue).toLocaleString('vi-VN')} km`
                    : ''}
                  {item.daysUntilDue > 0 && item.daysUntilDue < 9999
                    ? ` · ${item.daysUntilDue} ngày`
                    : item.daysUntilDue < 0
                    ? ` · quá ${Math.abs(item.daysUntilDue)} ngày`
                    : ''}
                </div>
              </div>
            </div>
          ))}

          {/* Ask AI CTA */}
          <div style={{
            textAlign: 'center', padding: '24px 0 8px',
            color: 'var(--text-3)', fontSize: '0.85rem'
          }}>
            💡 Nhấn vào bất kỳ hạng mục nào để hỏi AI giải thích chi tiết
          </div>
        </div>
      </div>
    </>
  );
}
