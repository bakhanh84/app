'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { calculateMaintenance, CarProfile, MaintenanceItem } from '@/lib/maintenance';

interface RadarItem extends MaintenanceItem {
  tier: 'urgent' | 'soon' | 'monitor' | 'good';
  progress: number; // 0–100
}

function getTier(item: MaintenanceItem): 'urgent' | 'soon' | 'monitor' | 'good' {
  if (item.urgency === 'overdue') return 'urgent';
  if (item.urgency === 'soon') return 'soon';
  if (item.urgency === 'upcoming') return 'monitor';
  return 'good';
}

function getProgress(item: MaintenanceItem): number {
  // Progress = how much of the interval has been used
  if (item.kmUntilDue <= 0) return 100;
  const totalInterval = item.intervalKm || 5000;
  const used = totalInterval - item.kmUntilDue;
  return Math.max(0, Math.min(100, (used / totalInterval) * 100));
}

function getTierConfig(tier: string) {
  switch (tier) {
    case 'urgent':  return { dot: 'red',    label: '🔴 Cần làm ngay',   bg: '#FEF2F2', border: 'rgba(239,68,68,0.2)',  fill: 'red' };
    case 'soon':    return { dot: 'orange',  label: '🟠 Sắp đến hạn',   bg: '#FFF8F5', border: 'rgba(255,85,0,0.15)', fill: 'orange' };
    case 'monitor': return { dot: 'yellow',  label: '🟡 Theo dõi',       bg: '#FFFBEB', border: 'rgba(245,158,11,0.2)',fill: 'yellow' };
    case 'good':    return { dot: 'green',   label: '🟢 Đang ổn',        bg: '#ECFDF5', border: 'rgba(16,185,129,0.2)',fill: 'green' };
    default:        return { dot: 'gray',    label: 'Khác',              bg: '#F8FAFC', border: 'var(--border)',       fill: 'gray' };
  }
}

const TYPE_ICONS: Record<string, string> = {
  oil: '🛢️', brake: '🛞', tire: '⭕', registration: '📋',
  insurance: '📄', battery: '🔋', coolant: '💧', custom: '🔧',
};

export default function CalendarPage() {
  const { data: session } = useSession();
  const [car, setCar] = useState<CarProfile | null>(null);
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [kmInput, setKmInput] = useState('');
  const [items, setItems] = useState<RadarItem[]>([]);
  const [updatingKm, setUpdatingKm] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedCar = localStorage.getItem('sparkgo_car');
    if (savedCar) {
      try {
        const parsed: CarProfile = JSON.parse(savedCar);
        setCar(parsed);
        setCurrentKm(parsed.currentKm);
        setKmInput(String(parsed.currentKm));
      } catch {}
    }

    if (session?.user) {
      fetch('/api/cars').then(r => r.json()).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCar(data[0]);
          setCurrentKm(data[0].currentKm);
          setKmInput(String(data[0].currentKm));
          localStorage.setItem('sparkgo_car', JSON.stringify(data[0]));
        }
      }).catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (car) {
      const updatedCar = { ...car, currentKm };
      const raw = calculateMaintenance(updatedCar);
      const mapped: RadarItem[] = raw.map(item => ({
        ...item,
        tier: getTier(item),
        progress: getProgress(item),
      }));
      setItems(mapped);
    }
  }, [car, currentKm]);

  const handleUpdateKm = async () => {
    const km = parseInt(kmInput);
    if (!km || km <= 0) return;
    setUpdatingKm(true);
    setCurrentKm(km);

    if (session?.user && car) {
      try {
        const savedCar = JSON.parse(localStorage.getItem('sparkgo_car') || '{}');
        if (savedCar.id) {
          await fetch('/api/cars', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: savedCar.id, currentKm: km }),
          });
          const updatedLocal = { ...savedCar, currentKm: km };
          localStorage.setItem('sparkgo_car', JSON.stringify(updatedLocal));
        }
      } catch {}
    }
    setUpdatingKm(false);
  };

  const handleDone = (itemName: string, itemLabel: string) => {
    setCompletedIds(prev => new Set([...prev, itemName]));
    // Save to memory
    const savedCar = localStorage.getItem('sparkgo_car');
    if (savedCar && session?.user) {
      try {
        const c = JSON.parse(savedCar);
        if (c.id) {
          fetch('/api/memory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              carId: c.id,
              memoryType: 'maintenance',
              title: `✓ ${itemLabel}`,
              content: `Đã hoàn thành: ${itemLabel} tại ${currentKm.toLocaleString('vi-VN')} km`,
              source: 'manual',
              severity: 'info',
            }),
          }).catch(() => {});
        }
      } catch {}
    }
  };

  const tiers = ['urgent', 'soon', 'monitor', 'good'] as const;
  const grouped = tiers.reduce((acc, tier) => {
    acc[tier] = items.filter(i => i.tier === tier && !completedIds.has(i.name));
    return acc;
  }, {} as Record<string, RadarItem[]>);

  const urgentCount = grouped.urgent.length;
  const soonCount = grouped.soon.length;

  return (
    <div className="calendar-page">
      {/* Header */}
      <div className="sg-header">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>🔧 Maintenance Radar</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {car ? `${car.brand} ${car.model} · ${currentKm.toLocaleString('vi-VN')} km` : 'Chưa có dữ liệu xe'}
          </div>
        </div>
        <Link href="/chat" style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
          Hỏi AI ›
        </Link>
      </div>

      {/* Summary pills */}
      {(urgentCount > 0 || soonCount > 0) && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0', flexWrap: 'wrap' }}>
          {urgentCount > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#DC2626' }}>
              🔴 {urgentCount} hạng mục khẩn
            </div>
          )}
          {soonCount > 0 && (
            <div style={{ background: 'var(--orange-pale)', border: '1px solid var(--orange-border)', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>
              🟠 {soonCount} sắp đến hạn
            </div>
          )}
        </div>
      )}

      {/* Mileage Update */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="mileage-update-card">
          <div className="mileage-update-label">📍 Cập nhật số km hiện tại</div>
          <div className="mileage-update-row">
            <input
              className="mileage-input"
              type="number"
              value={kmInput}
              onChange={e => setKmInput(e.target.value)}
              placeholder="Nhập số km..."
            />
            <button
              className="mileage-save-btn"
              onClick={handleUpdateKm}
              disabled={updatingKm}
            >
              {updatingKm ? '...' : 'Cập nhật'}
            </button>
          </div>
        </div>
      </div>

      {/* Radar Items */}
      <div className="radar-section">
        {items.length === 0 && !car ? (
          <div className="sg-empty" style={{ paddingTop: 32 }}>
            <div className="sg-empty-icon">🔧</div>
            <div className="sg-empty-title">Chưa có dữ liệu xe</div>
            <div className="sg-empty-desc">Thêm xe để SparkGo tính toán lịch bảo dưỡng cho bạn.</div>
            <div style={{ marginTop: 16 }}>
              <Link href="/onboarding" style={{ padding: '12px 24px', background: 'var(--orange)', color: '#FFF', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                + Thêm xe ngay
              </Link>
            </div>
          </div>
        ) : (
          tiers.map(tier => {
            const tierItems = grouped[tier];
            if (tierItems.length === 0 && tier === 'good') return null;
            const conf = getTierConfig(tier);
            return (
              <div key={tier}>
                <div className="radar-tier-header">
                  <span className={`radar-tier-dot ${conf.dot}`} />
                  <span className="radar-tier-label">{conf.label}</span>
                  <span className="radar-tier-count">{tierItems.length} hạng mục</span>
                </div>
                {tierItems.length === 0 ? (
                  <div style={{ background: conf.bg, border: `1px solid ${conf.border}`, borderRadius: 14, padding: '12px 16px', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>Không có hạng mục nào ở mức này ✓</span>
                  </div>
                ) : (
                  tierItems.map(item => (
                    <div
                      key={item.name}
                      className={`radar-item${tier === 'urgent' ? ' urgent-item' : tier === 'soon' ? ' soon-item' : ''}`}
                    >
                      <div className={`radar-item-icon`} style={{ background: conf.bg }}>
                        {TYPE_ICONS[item.nameEn?.toLowerCase() || ''] || item.icon || '🔧'}
                      </div>
                      <div className="radar-item-info">
                        <div className="radar-item-title">{item.name}</div>
                        <div className="radar-item-detail">
                          {item.description}
                        </div>
                        {item.kmUntilDue !== undefined && (
                          <div className="radar-item-bar-wrap">
                            <div className="radar-item-bar">
                              <div
                                className={`radar-item-bar-fill ${conf.fill}`}
                                style={{ width: `${Math.min(item.progress, 100)}%` }}
                              />
                            </div>
                            <div className="radar-item-km">
                              {item.kmUntilDue > 0
                                ? `Còn khoảng ${item.kmUntilDue.toLocaleString('vi-VN')} km`
                                : `Đã quá hạn ${Math.abs(item.kmUntilDue).toLocaleString('vi-VN')} km`}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                        <button
                          className="radar-done-btn"
                          onClick={() => handleDone(item.name, item.name)}
                        >
                          ✓ Xong
                        </button>
                        <Link
                          href={`/chat?prompt=${encodeURIComponent(`Tư vấn về: ${item.name}`)}`}
                          style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                        >
                          Hỏi AI
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Seasonal Maintenance Check */}
      <div style={{ padding: '4px 20px 12px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
          border: '1.5px solid rgba(59,130,246,0.2)',
          borderRadius: 18,
          padding: 16,
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 18 }}>🌧️</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1E40AF' }}>Gợi ý chăm sóc theo mùa</span>
            </div>
            <Link
              href={`/chat${car?.id ? `?carId=${(car as any).id}&prompt=Kiem tra xe mua mua` : '?prompt=Kiem tra xe mua mua'}`}
              style={{ fontSize: 11, fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}
            >
              Hỏi AI ›
            </Link>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 10 }}>
            Điều kiện đường sá Việt Nam (mưa ngập & nắng nóng) có 3 hạng mục cần lưu tâm:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { icon: '🌧️', label: 'Cần gạt mưa', hint: 'Thay sau 6–12 tháng' },
              { icon: '⭕', label: 'Rãnh lốp xe', hint: 'Chống trượt nước' },
              { icon: '💧', label: 'Nước làm mát', hint: 'Tránh sôi két nước' },
              { icon: '❄️', label: 'Gas máy lạnh', hint: 'Lọc gió điều hòa' },
            ].map((s, idx) => (
              <div key={idx} style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 11 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-1)' }}>{s.icon} {s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{s.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add custom reminder */}
      <div style={{ padding: '0 20px 16px' }}>
        <Link
          href="/chat?prompt=nhacbaodung"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: '#FFF', border: '1.5px dashed var(--orange-border)', borderRadius: 16, fontSize: 13, fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}
        >
          ➕ Thêm nhắc nhở tùy chỉnh qua AI
        </Link>
      </div>
    </div>
  );
}
