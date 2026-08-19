'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getCarImageUrl } from '@/lib/car-images';

interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate?: string;
  currentKm: number;
  healthScore: number;
  lastOilChangeKm?: number;
  profileComplete?: number;
  dnaEngine?: string;
  dnaSuspension?: string;
  dnaBrakes?: string;
  dnaBattery?: string;
  dnaTires?: string;
  image?: string;
}

interface MaintenanceReminder {
  id: string;
  type: string;
  label: string;
  dueKm?: number;
  dueDate?: string;
}

const DEFAULT_CARS: CarData[] = [
  {
    id: 'car-bmw', brand: 'BMW', model: '3 Series', year: 2014,
    licensePlate: '51F-xxxx', currentKm: 86000, healthScore: 88,
    profileComplete: 65, dnaEngine: 'good', dnaSuspension: 'monitor',
    dnaBrakes: 'good', dnaBattery: 'monitor', dnaTires: 'good',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'car-mazda', brand: 'Mazda', model: 'CX-5', year: 2020,
    licensePlate: '30H-888.88', currentKm: 42000, healthScore: 94,
    profileComplete: 40,
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
  },
];

const DNA_CONFIG: Record<string, { label: string; icon: string }> = {
  engine:     { label: 'Động cơ', icon: '⚙️' },
  suspension: { label: 'Treo', icon: '🔩' },
  brakes:     { label: 'Phanh', icon: '🛞' },
  battery:    { label: 'Ắc quy', icon: '🔋' },
  tires:      { label: 'Lốp', icon: '⭕' },
};

function getDNAStatus(status?: string) {
  if (status === 'good')    return 'good';
  if (status === 'monitor') return 'monitor';
  if (status === 'urgent')  return 'urgent';
  return 'unknown';
}

function getHealthLabel(score: number) {
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 70) return 'Khá';
  return 'Cần kiểm tra';
}

function getHealthDesc(score: number, car: CarData) {
  if (score >= 90) return `Xe đang hoạt động rất tốt. Tiếp tục duy trì lịch bảo dưỡng nhé!`;
  if (score >= 80) return `Tình trạng tốt. Có một vài hạng mục nên theo dõi.`;
  return `Cần kiểm tra một số hạng mục sớm để giữ xe ở trạng thái tốt.`;
}

function formatKm(km: number) {
  return km.toLocaleString('vi-VN');
}

export default function HomePage() {
  const { data: session } = useSession();
  const [userCars, setUserCars] = useState<CarData[]>([]);
  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!session?.user) { setLoading(false); return; }
    try {
      const [carsRes, remindRes] = await Promise.all([
        fetch('/api/cars'),
        fetch('/api/notifications'),
      ]);
      const carsData = await carsRes.json();
      if (Array.isArray(carsData) && carsData.length > 0) {
        const mapped: CarData[] = carsData.map((c: any) => ({
          id: c.id,
          brand: c.brand || 'Xe',
          model: c.model || 'Ô tô',
          year: c.year || 2020,
          licensePlate: c.licensePlate,
          currentKm: c.currentKm || 0,
          healthScore: c.healthScore || 85,
          profileComplete: c.profileComplete || 10,
          lastOilChangeKm: c.lastOilChangeKm,
          dnaEngine: c.dnaEngine,
          dnaSuspension: c.dnaSuspension,
          dnaBrakes: c.dnaBrakes,
          dnaBattery: c.dnaBattery,
          dnaTires: c.dnaTires,
          image: getCarImageUrl(c.brand, c.model, c.year),
        }));
        setUserCars(mapped);
      }
      if (remindRes.ok) {
        const rData = await remindRes.json();
        if (Array.isArray(rData)) setReminders(rData.slice(0, 3));
      }
    } catch {}
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cars = userCars.length > 0 ? userCars : DEFAULT_CARS;
  const car = cars[activeCarIndex] || cars[0];
  const userName = session?.user?.name?.split(' ')[0] || 'bạn';

  const dnaItems = [
    { key: 'engine',     status: car.dnaEngine },
    { key: 'suspension', status: car.dnaSuspension },
    { key: 'brakes',     status: car.dnaBrakes },
    { key: 'battery',    status: car.dnaBattery },
    { key: 'tires',      status: car.dnaTires },
  ];

  const completeness = car.profileComplete ?? 30;

  // Quick log types
  const quickLogTypes = [
    { type: 'oil_change',  icon: '🛢️', label: 'Thay dầu',      sub: 'Dầu máy & lọc dầu' },
    { type: 'tire',        icon: '⭕',  label: 'Thay lốp',      sub: 'Lốp xe mới' },
    { type: 'brake',       icon: '🛞',  label: 'Thay phanh',    sub: 'Má phanh / dĩa' },
    { type: 'battery',     icon: '🔋',  label: 'Thay ắc quy',   sub: 'Bình mới' },
    { type: 'ac',          icon: '❄️',  label: 'Sửa điều hòa',  sub: 'Hệ thống lạnh' },
    { type: 'coolant',     icon: '💧',  label: 'Nước làm mát',  sub: 'Thay / bổ sung' },
    { type: 'inspection',  icon: '📋',  label: 'Đăng kiểm',     sub: 'Kiểm định xe' },
    { type: 'other',       icon: '🔧',  label: 'Khác',          sub: 'Ghi nhận sự cố' },
  ];

  const handleQuickLog = async (type: string, label: string) => {
    if (!car.id || car.id.startsWith('car-')) {
      alert('Vui lòng đăng nhập để lưu lịch sử xe!');
      setShowQuickLog(false);
      return;
    }
    setCompletingId(type);
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          memoryType: type,
          title: label,
          content: `Ghi nhận: ${label}`,
          source: 'manual',
          severity: 'info',
        }),
      });
      // Also create service record
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: car.id,
          serviceName: label,
          odometerKm: car.currentKm,
          serviceType: type,
        }),
      });
    } catch {}
    setCompletingId(null);
    setShowQuickLog(false);
  };

  return (
    <div className="sg-app-layout">
      {/* Header */}
      <header className="sg-app-header">
        <Link href="/" className="sg-brand">
          <div className="sg-logo-box">⚡</div>
          <span className="sg-brand-name">Spark<span>Go</span></span>
        </Link>
        <div className="sg-header-actions">
          <button className="sg-icon-btn" aria-label="Thông báo">
            🔔
            {reminders.length > 0 && <span className="dot" />}
          </button>
          <Link href="/garage" className="sg-gara-top-btn">
            <span>🚗</span>
            <span>Xe Tôi</span>
          </Link>
        </div>
      </header>

      {/* Greeting */}
      <div className="sg-greeting-header">
        <div>
          <h1 className="sg-greeting-title">👋 Xin chào, {userName}!</h1>
          <div className="sg-greeting-sub">
            <span>🤖</span>
            <span>AI Thợ Xe sẵn sàng tư vấn 24/7</span>
          </div>
        </div>
        <Link href="/login">
          <div className="sg-avatar-wrapper">
            <img
              src={session?.user?.image || 'https://api.iconify.design/fluent-emoji:robot.svg'}
              alt={userName}
              className="sg-avatar-img"
            />
          </div>
        </Link>
      </div>

      {/* Car Carousel */}
      <section className="sg-carousel-section">
        <div className="sg-carousel-wrapper">
          <button
            className="sg-carousel-arrow left"
            onClick={() => setActiveCarIndex(p => (p - 1 + cars.length) % cars.length)}
            aria-label="Xe trước"
          >‹</button>

          <div
            className="sg-car-card"
            style={{ backgroundImage: `url('${car.image || DEFAULT_CARS[0].image}')` }}
          >
            <div className="sg-car-card-overlay">
              <div className="sg-car-card-top">
                <span className="sg-car-index-tag">{activeCarIndex + 1}/{cars.length}</span>
                <Link href="/garage" className="sg-car-more-btn" title="Xem chi tiết xe">···</Link>
              </div>
              <div className="sg-car-card-bottom">
                <h2 className="sg-car-name">{car.brand} {car.model}</h2>
                <div className="sg-car-details">
                  {car.year} · {formatKm(car.currentKm)} km
                  {car.licensePlate && ` · ${car.licensePlate}`}
                </div>
                <div className="sg-car-status-bar">
                  <div className="sg-status-good">
                    <span className="sg-status-dot" />
                    <span>Health {car.healthScore}/100</span>
                  </div>
                  <span className="sg-status-cert">{getHealthLabel(car.healthScore)} ›</span>
                </div>
              </div>
            </div>
          </div>

          <button
            className="sg-carousel-arrow right"
            onClick={() => setActiveCarIndex(p => (p + 1) % cars.length)}
            aria-label="Xe kế tiếp"
          >›</button>
        </div>
        <div className="sg-pagination-dots">
          {cars.map((_, i) => (
            <span key={i} className={`sg-dot${i === activeCarIndex ? ' active' : ''}`} onClick={() => setActiveCarIndex(i)} />
          ))}
        </div>
      </section>

      {/* Health Score Card */}
      <Link href="/garage" className="sg-health-card" style={{ display: 'flex', textDecoration: 'none' }}>
        <div className="sg-health-score-circle">
          <span className="sg-health-score-num">{car.healthScore}</span>
          <span className="sg-health-score-denom">/100</span>
        </div>
        <div className="sg-health-info">
          <h3>Vehicle Health — {getHealthLabel(car.healthScore)}</h3>
          <p>{getHealthDesc(car.healthScore, car)}</p>
        </div>
        <span className="sg-health-arrow">›</span>
      </Link>

      {/* Vehicle DNA Mini */}
      <div className="sg-dna-mini">
        <div className="sg-dna-mini-header">
          <span className="sg-dna-mini-title">🧬 Vehicle DNA</span>
          <Link href="/garage" className="sg-dna-mini-link">Xem chi tiết ›</Link>
        </div>
        <div className="sg-dna-mini-grid">
          {dnaItems.map(({ key, status }) => {
            const conf = DNA_CONFIG[key];
            const st = getDNAStatus(status);
            return (
              <div key={key} className="sg-dna-item">
                <div className={`sg-dna-icon ${st}`}>{conf.icon}</div>
                <span className="sg-dna-label">{conf.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Profile Completeness & Actionable Gaps */}
      <div className="sg-complete-card">
        <div className="sg-complete-header">
          <span className="sg-complete-title">Độ hiểu chiếc xe này</span>
          <span className="sg-complete-pct">{completeness}%</span>
        </div>
        <div className="sg-complete-bar">
          <div className="sg-complete-fill" style={{ width: `${completeness}%` }} />
        </div>
        <p className="sg-complete-hint">
          {completeness < 50
            ? `SparkGo đã hiểu ${completeness}% về chiếc ${car.brand} ${car.model}. Thêm thông tin dưới đây để AI tư vấn chuẩn xác hơn:`
            : completeness < 80
            ? `Tốt! SparkGo đã hiểu ${completeness}% về chiếc xe này. Hoàn thiện nốt các mục sau để tối ưu hóa:`
            : `Tuyệt vời! SparkGo hiểu ${completeness}% về chiếc xe này — AI có thể đưa ra tư vấn chuyên sâu nhất.`}
        </p>

        {/* Actionable data gap pills */}
        {completeness < 100 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {!car.lastOilChangeKm && (
              <button
                onClick={() => setShowQuickLog(true)}
                style={{
                  background: '#FFF0EB', border: '1px solid rgba(255,85,0,0.2)',
                  borderRadius: 99, padding: '5px 10px', fontSize: 11, fontWeight: 700,
                  color: 'var(--orange)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <span>➕ +15%</span> Ghi nhận lần thay dầu cuối
              </button>
            )}
            {(!car.licensePlate || car.licensePlate.includes('xxxx')) && (
              <Link
                href="/onboarding"
                style={{
                  background: '#EFF6FF', border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 99, padding: '5px 10px', fontSize: 11, fontWeight: 700,
                  color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <span>➕ +10%</span> Cập nhật biển số xe
              </Link>
            )}
            <Link
              href={`/chat${car.id && !car.id.startsWith('car-') ? `?carId=${car.id}&prompt=baogiagarage` : '?prompt=baogiagarage'}`}
              style={{
                background: '#F5F3FF', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 99, padding: '5px 10px', fontSize: 11, fontWeight: 700,
                color: '#7C3AED', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <span>📄 +15%</span> Tải hóa đơn sửa chữa gần nhất
            </Link>
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="sg-metrics-grid">
        <div className="sg-metric-card">
          <div className="sg-metric-label">SỐ KM HIỆN TẠI</div>
          <div className="sg-metric-value">{formatKm(car.currentKm)} km</div>
          <div className="sg-metric-icon-box">🧭</div>
        </div>
        <div className="sg-metric-card">
          <div className="sg-metric-label">DẦU GẦN NHẤT</div>
          <div className="sg-metric-value">
            {car.lastOilChangeKm
              ? `${formatKm(car.currentKm - car.lastOilChangeKm)} km trước`
              : 'Chưa có'}
          </div>
          <div className="sg-metric-icon-box">🛢️</div>
        </div>
        <div className="sg-metric-card">
          <div className="sg-metric-label">AI ĐÁNH GIÁ</div>
          <div className={`sg-metric-value ${car.healthScore >= 80 ? 'good-green' : ''}`}>
            {getHealthLabel(car.healthScore)}
          </div>
          <Link href="/garage" className="sg-metric-link">Xem DNA ›</Link>
        </div>
      </div>

      {/* Action Row */}
      <div className="sg-action-row">
        <Link href={`/chat${car.id && !car.id.startsWith('car-') ? `?carId=${car.id}` : ''}`} className="sg-btn-main-orange">
          <span>💬</span>
          <span>Hỏi AI Thợ Xe</span>
        </Link>
        <button className="sg-btn-secondary-white" onClick={() => setShowQuickLog(true)}>
          <span>➕</span>
          <span>Cập nhật</span>
        </button>
      </div>

      {/* Car Confessional ("Tâm sự với xe") */}
      <section style={{ marginTop: 6 }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">🎙️ Tâm sự về xe</h3>
          <Link href="/chat" className="sg-section-link">Mở AI Chat ›</Link>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFFFF 100%)',
          border: '1.5px solid var(--orange-border)',
          borderRadius: 18,
          padding: 16,
          boxShadow: 'var(--shadow-xs)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--orange)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              🤝
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-1)' }}>Kể cho SparkGo nghe về xe hôm nay</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>AI ghi nhớ triệu chứng và dự đoán sớm sự cố</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: '🚘 Xe rung ở tốc độ cao', q: 'Hôm nay đi cao tốc thấy xe có hiện tượng rung nhẹ ở tốc độ 90-100 km/h.' },
              { label: '🔊 Tiếng kêu lạ ở gầm', q: 'Xe đi vào chỗ xóc nghe tiếng lục cục ở phía gầm trước.' },
              { label: '⛽ Dạo này tốn xăng hơn', q: 'Chiếc xe này dạo gần đây đi phố có vẻ tốn xăng hơn bình thường.' },
              { label: '💰 Garage báo giá sửa', q: 'Garage vừa báo giá sửa chữa thay thế một số hạng mục, tôi muốn hỏi xem có hợp lý không.' },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={`/chat${car.id && !car.id.startsWith('car-') ? `?carId=${car.id}&prompt=${encodeURIComponent(item.q)}` : `?prompt=${encodeURIComponent(item.q)}`}`}
                style={{
                  padding: '9px 10px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-1)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section style={{ marginTop: 14 }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">Thao tác nhanh</h3>
          <Link href="/garage?tab=cost" className="sg-section-link">Chi tiết chi phí ›</Link>
        </div>
        <div className="sg-quick-grid">
          <Link href="/garage?tab=cost" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#ECFDF5', color: '#10B981', borderColor: 'rgba(16,185,129,0.2)' }}>💰</div>
            <span className="sg-quick-label">Chi phí xe</span>
          </Link>
          <Link href="/chat?prompt=chandoan" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#FFF0EB', color: '#FF5500', borderColor: 'rgba(255,85,0,0.15)' }}>🔧</div>
            <span className="sg-quick-label">Sự cố & sửa</span>
          </Link>
          <Link href="/calendar" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#FFFBEB', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.15)' }}>🛠️</div>
            <span className="sg-quick-label">Bảo dưỡng</span>
          </Link>
          <Link href="/chat?prompt=baogiagarage" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#EFF6FF', color: '#3B82F6', borderColor: 'rgba(59,130,246,0.15)' }}>🧾</div>
            <span className="sg-quick-label">Đọc báo giá</span>
          </Link>
          <Link href="/history" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#F5F3FF', color: '#8B5CF6', borderColor: 'rgba(139,92,246,0.15)' }}>📜</div>
            <span className="sg-quick-label">Lịch sử xe</span>
          </Link>
        </div>
      </section>

      {/* Upcoming Maintenance */}
      <section style={{ marginTop: 14 }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">Maintenance Radar</h3>
          <Link href="/calendar" className="sg-section-link">Xem tất cả ›</Link>
        </div>
        <div className="sg-card-container">
          {reminders.length > 0 ? reminders.map(r => (
            <div key={r.id} className="sg-maint-card" style={{ marginBottom: 8 }}>
              <div className="sg-maint-icon urgent">🛢️</div>
              <div className="sg-maint-info">
                <div className="sg-maint-title">{r.label}</div>
                <div className="sg-maint-sub">
                  {r.dueKm ? `Còn khoảng ${formatKm(Math.max(0, r.dueKm - car.currentKm))} km` : 'Sắp đến hạn'}
                </div>
              </div>
              <Link href="/calendar" className="sg-maint-btn">Chi tiết</Link>
            </div>
          )) : (
            // Default card if no real reminders
            <div className="sg-maint-card">
              <div className="sg-maint-icon default">🛢️</div>
              <div className="sg-maint-info">
                <div className="sg-maint-title">Thay dầu động cơ</div>
                <div className="sg-maint-sub">
                  {car.lastOilChangeKm
                    ? `Đã đi ${formatKm(car.currentKm - car.lastOilChangeKm)} km từ lần thay dầu`
                    : 'Chưa có dữ liệu — hãy ghi nhận lần thay dầu gần nhất'}
                </div>
                <div className="sg-maint-progress-bg">
                  <div className="sg-maint-progress-fill" style={{ width: car.lastOilChangeKm ? `${Math.min(((car.currentKm - car.lastOilChangeKm) / 5000) * 100, 100)}%` : '15%' }} />
                </div>
              </div>
              <Link href="/calendar" className="sg-maint-btn">Chi tiết</Link>
            </div>
          )}
        </div>
      </section>

      {/* AI Recommendation & Seasonal Checklist */}
      <section style={{ marginTop: 14 }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">AI Thợ Xe gợi ý</h3>
          <Link href="/chat" className="sg-section-link">Hỏi thêm ›</Link>
        </div>
        <div className="sg-card-container">
          <Link
            href={`/chat${car.id && !car.id.startsWith('car-') ? `?carId=${car.id}` : ''}`}
            className="sg-recom-card"
          >
            <div className="sg-recom-icon">
              {car.dnaBattery === 'monitor' ? '🔋' : car.dnaSuspension === 'monitor' ? '🔩' : '🛡️'}
            </div>
            <div className="sg-recom-info">
              <div className="sg-recom-title">
                {car.dnaBattery === 'monitor'
                  ? 'Kiểm tra ắc quy'
                  : car.dnaSuspension === 'monitor'
                  ? 'Kiểm tra hệ thống treo'
                  : 'Tổng kiểm tra tình trạng xe'}
              </div>
              <div className="sg-recom-sub">
                {car.dnaBattery === 'monitor'
                  ? `Ắc quy xe ${car.brand} nên được đo điện áp định kỳ. Nhấn để hỏi AI.`
                  : `Nhấn để AI Thợ Xe phân tích tình trạng chiếc ${car.brand} ${car.model}.`}
              </div>
            </div>
            <div className="sg-recom-arrow">›</div>
          </Link>
        </div>
      </section>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div className="sg-modal-overlay" onClick={() => setShowQuickLog(false)}>
          <div className="sg-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-handle" />
            <div className="sg-modal-header">
              <span className="sg-modal-title">➕ Ghi nhận nhanh</span>
              <button className="sg-modal-close" onClick={() => setShowQuickLog(false)}>✕</button>
            </div>
            <div className="sg-modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                Chọn hạng mục để ghi nhận cho <strong>{car.brand} {car.model}</strong>:
              </p>
              <div className="sg-quick-log-grid">
                {quickLogTypes.map(item => (
                  <button
                    key={item.type}
                    className="sg-quick-log-item"
                    onClick={() => handleQuickLog(item.type, item.label)}
                    disabled={completingId === item.type}
                  >
                    <span className="sg-quick-log-icon">{item.icon}</span>
                    <div>
                      <div className="sg-quick-log-label">
                        {completingId === item.type ? '✓ Đã lưu!' : item.label}
                      </div>
                      <div className="sg-quick-log-sub">{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <Link
                  href={`/chat${car.id && !car.id.startsWith('car-') ? `?carId=${car.id}` : ''}`}
                  className="sg-btn sg-btn-ghost w-full"
                  style={{ display: 'flex', textDecoration: 'none' }}
                  onClick={() => setShowQuickLog(false)}
                >
                  💬 Mô tả chi tiết qua AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
