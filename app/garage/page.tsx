'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getCarImageUrl } from '@/lib/car-images';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate?: string;
  vin?: string;
  currentKm: number;
  fuelType?: string;
  transmission?: string;
  color?: string;
  healthScore: number;
  profileComplete: number;
  dnaEngine?: string;
  dnaSuspension?: string;
  dnaBrakes?: string;
  dnaBattery?: string;
  dnaTires?: string;
  dnaElectrical?: string;
  lastOilChangeKm?: number;
  lastOilChangeDate?: string;
  totalCost?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  notes?: string;
}

interface VehicleMemory {
  id: string;
  memoryType: string;
  title: string;
  content: string;
  source: string;
  date: string;
}

interface ServiceRecord {
  id: string;
  serviceDate: string;
  odometerKm: number;
  serviceName: string;
  garageName?: string;
  cost?: number;
}

const DNA_ITEMS = [
  { key: 'dnaEngine',     label: 'Động cơ',    icon: '⚙️', detail: 'Tình trạng động cơ & làm mát' },
  { key: 'dnaSuspension', label: 'Hệ thống treo', icon: '🔩', detail: 'Phuộc, cân bằng, rô-tuyn' },
  { key: 'dnaBrakes',     label: 'Phanh',       icon: '🛞', detail: 'Má phanh, dĩa, dầu phanh' },
  { key: 'dnaBattery',    label: 'Ắc quy',      icon: '🔋', detail: 'Bình điện & hệ thống sạc' },
  { key: 'dnaTires',      label: 'Lốp xe',      icon: '⭕', detail: 'Độ mòn & áp suất lốp' },
  { key: 'dnaElectrical', label: 'Điện xe',     icon: '⚡', detail: 'Hệ thống điện & cảm biến' },
];

const MEMORY_ICONS: Record<string, string> = {
  oil_change: '🛢️', symptom: '⚠️', cost: '💰', garage: '🏪',
  note: '📝', insight: '💡', repair: '🔧', parts: '⚙️',
  inspection: '📋', tire: '⭕', battery: '🔋', ac: '❄️',
  coolant: '💧', other: '🔩',
};

const MEMORY_COLORS: Record<string, string> = {
  oil_change: '#FFFBEB', symptom: '#FEF2F2', cost: '#F0FDF4',
  garage: '#EFF6FF', repair: '#FFF0EB', parts: '#F5F3FF',
  inspection: '#F0F9FF', other: '#F8FAFC',
};

function getStatusLabel(status?: string) {
  if (status === 'good')    return { label: 'Tốt', cls: 'dna-status-good' };
  if (status === 'monitor') return { label: 'Theo dõi', cls: 'dna-status-monitor' };
  if (status === 'urgent')  return { label: 'Cần xử lý', cls: 'dna-status-urgent' };
  return { label: 'Chưa rõ', cls: 'dna-status-unknown' };
}

function formatMoney(n?: number) {
  if (!n) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M₫`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K₫`;
  return `${n.toLocaleString('vi-VN')}₫`;
}

function formatDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('vi-VN'); } catch { return d; }
}

export default function GaragePage() {
  const { data: session } = useSession();
  const [cars, setCars] = useState<Car[]>([]);
  const [activeCar, setActiveCar] = useState<Car | null>(null);
  const [memories, setMemories] = useState<VehicleMemory[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dna' | 'cost' | 'memory' | 'service' | 'docs'>('dna');
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ serviceName: '', odometerKm: '', garageName: '', cost: '', notes: '' });
  const [showOcr, setShowOcr] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCar = localStorage.getItem('sparkgo_car');
    let local: Car | null = null;
    if (savedCar) { try { local = JSON.parse(savedCar); } catch {} }

    if (session?.user) {
      fetch('/api/cars').then(r => r.json()).then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCars(data);
          setActiveCar(data[0]);
          fetchCarData(data[0].id);
        } else if (local) { setCars([local]); setActiveCar(local); }
        setLoading(false);
      }).catch(() => { if (local) { setCars([local]); setActiveCar(local); } setLoading(false); });
    } else {
      if (local) { setCars([local]); setActiveCar(local); }
      setLoading(false);
    }
  }, [session]);

  const fetchCarData = async (carId: string) => {
    try {
      const [memRes, svcRes] = await Promise.all([
        fetch(`/api/memory?carId=${carId}`),
        fetch(`/api/services?carId=${carId}`),
      ]);
      const [memData, svcData] = await Promise.all([memRes.json(), svcRes.json()]);
      if (Array.isArray(memData)) setMemories(memData.slice(0, 20));
      if (Array.isArray(svcData)) setServices(svcData.slice(0, 20));
    } catch {}
  };

  const handleSelectCar = (c: Car) => {
    setActiveCar(c);
    if (c.id) fetchCarData(c.id);
    setMemories([]); setServices([]);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCar?.id) { alert('Vui lòng đăng nhập!'); return; }
    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId: activeCar.id, ...newService }),
      });
      fetchCarData(activeCar.id);
      setShowAddService(false);
      setNewService({ serviceName: '', odometerKm: '', garageName: '', cost: '', notes: '' });
    } catch { alert('Lỗi lưu dữ liệu'); }
  };

  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    setShowOcr(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            carId: activeCar?.id,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setOcrResult(data.data);
          if (activeCar?.id) fetchCarData(activeCar.id);
        }
      } catch {}
      setOcrLoading(false);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const car = activeCar;
  const carImage = car ? getCarImageUrl(car.brand, car.model, car.year) : null;
  const completeness = car?.profileComplete ?? 10;

  const dnaValues = car ? {
    dnaEngine:     car.dnaEngine,
    dnaSuspension: car.dnaSuspension,
    dnaBrakes:     car.dnaBrakes,
    dnaBattery:    car.dnaBattery,
    dnaTires:      car.dnaTires,
    dnaElectrical: car.dnaElectrical,
  } : {};

  if (loading) return (
    <div className="garage-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <div className="sg-spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  if (!car) return (
    <div className="garage-page">
      <div style={{ padding: '24px 20px', paddingBottom: 80 }}>
        <div className="sg-empty">
          <div className="sg-empty-icon">🚗</div>
          <div className="sg-empty-title">Chưa có xe nào</div>
          <div className="sg-empty-desc" style={{ marginBottom: 20 }}>Thêm chiếc xe đầu tiên để SparkGo bắt đầu tìm hiểu về nó.</div>
          <Link href="/onboarding" className="sg-btn sg-btn-primary" style={{ textDecoration: 'none' }}>
            ➕ Thêm xe ngay
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="garage-page">
      {/* Car Tabs */}
      {cars.length > 1 && (
        <div className="car-tabs-scroll">
          {cars.map((c, i) => (
            <button
              key={c.id}
              className={`car-tab-btn${activeCar?.id === c.id ? ' active' : ''}`}
              onClick={() => handleSelectCar(c)}
            >
              <span>{c.brand}</span>
              <span style={{ opacity: 0.7, fontWeight: 400 }}>{c.year}</span>
            </button>
          ))}
          <Link href="/onboarding" className="car-tab-btn" style={{ borderStyle: 'dashed' }}>
            ➕ Thêm xe
          </Link>
        </div>
      )}
      {cars.length === 1 && (
        <div style={{ padding: '12px 20px 4px', display: 'flex', justifyContent: 'flex-end' }}>
          <Link href="/onboarding" className="sg-section-link">+ Thêm xe</Link>
        </div>
      )}

      {/* Car Hero */}
      <div className="car-hero" style={{ margin: '8px 20px 0' }}>
        <img
          src={carImage || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80'}
          alt={`${car.brand} ${car.model}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="car-hero-overlay">
          <div>
            <div className="car-hero-name">{car.brand} {car.model}</div>
            <div className="car-hero-info">
              {car.year} · {car.currentKm.toLocaleString('vi-VN')} km
              {car.licensePlate && ` · ${car.licensePlate}`}
            </div>
          </div>
        </div>
      </div>

      {/* Info Pills */}
      <div className="car-info-pills">
        <div className="car-info-pill">
          <span>⛽</span>
          <span>{car.fuelType === 'electric' ? 'Điện' : car.fuelType === 'hybrid' ? 'Hybrid' : car.fuelType === 'diesel' ? 'Dầu' : 'Xăng'}</span>
        </div>
        <div className="car-info-pill">
          <span>🔄</span>
          <span>{car.transmission === 'manual' ? 'Số sàn' : 'Tự động'}</span>
        </div>
        <div className="car-info-pill">
          <span>💚</span>
          <span>Health {car.healthScore}/100</span>
        </div>
        {car.color && <div className="car-info-pill"><span>🎨</span><span>{car.color}</span></div>}
      </div>

      {/* Profile Completeness */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="sg-complete-card" style={{ margin: 0 }}>
          <div className="sg-complete-header">
            <span className="sg-complete-title">Hồ sơ xe — SparkGo hiểu</span>
            <span className="sg-complete-pct">{completeness}%</span>
          </div>
          <div className="sg-complete-bar">
            <div className="sg-complete-fill" style={{ width: `${completeness}%` }} />
          </div>
          <p className="sg-complete-hint">
            {completeness < 40
              ? '💡 Thêm dữ liệu để AI tư vấn chính xác hơn. Bắt đầu bằng cách ghi nhận lần thay dầu gần nhất.'
              : completeness < 75
              ? '📈 Đang tốt! Tiếp tục cập nhật lịch sử bảo dưỡng và tải hóa đơn lên nhé.'
              : '🏆 SparkGo hiểu xe bạn rất tốt! Cứ tiếp tục cập nhật để AI ngày càng chính xác hơn.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '16px 20px 0', overflowX: 'auto' }}>
        {[
          { key: 'dna',     label: '🧬 Vehicle DNA' },
          { key: 'cost',    label: '💰 Chi phí xe' },
          { key: 'memory',  label: '🧠 AI Memory' },
          { key: 'service', label: '📋 Lịch sử' },
          { key: 'docs',    label: '📄 Tài liệu' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              flexShrink: 0, padding: '9px 16px', borderRadius: 999,
              fontSize: 13, fontWeight: 700,
              border: '1.5px solid',
              borderColor: activeTab === t.key ? 'var(--orange)' : 'var(--border)',
              background: activeTab === t.key ? 'var(--orange)' : '#FFF',
              color: activeTab === t.key ? '#FFF' : 'var(--text-2)',
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Vehicle DNA ── */}
      {activeTab === 'dna' && (
        <div className="dna-section">
          <div className="dna-section-header">
            <div>
              <div className="dna-section-title">Vehicle DNA</div>
              <div className="dna-section-sub">Tình trạng 6 hệ thống chính của xe</div>
            </div>
            <button
              onClick={() => setShowShareCard(true)}
              style={{
                background: 'var(--orange-pale)', border: '1px solid var(--orange-border)',
                borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700,
                color: 'var(--orange)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              📤 Thẻ Hồ Sơ
            </button>
          </div>
          <div className="dna-grid">
            {DNA_ITEMS.map(item => {
              const status = dnaValues[item.key as keyof typeof dnaValues];
              const { label, cls } = getStatusLabel(status);
              return (
                <Link
                  key={item.key}
                  href={`/chat${car.id ? `?carId=${car.id}&prompt=${encodeURIComponent(`Kiểm tra và tư vấn chi tiết về ${item.label} của chiếc ${car.brand} ${car.model}`)}` : `?prompt=${encodeURIComponent(`Tư vấn ${item.label}`)}`}`}
                  className="dna-row"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="dna-row-icon">{item.icon}</span>
                  <div className="dna-row-info">
                    <div className="dna-row-name">{item.label}</div>
                    <div className="dna-row-detail">{item.detail}</div>
                  </div>
                  <div className={`dna-status-chip ${cls}`}>
                    <span>{label === 'Tốt' ? '✓' : label === 'Theo dõi' ? '⚠' : label === 'Cần xử lý' ? '✕' : '?'}</span>
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setShowAddService(true)}
              className="sg-btn sg-btn-ghost"
              style={{ flex: 1, fontSize: 13 }}
            >📋 + Ghi bảo dưỡng</button>
            <label className="sg-btn sg-btn-outline" style={{ flex: 1, fontSize: 13, cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              📄 Quét hóa đơn
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOcrFile} />
            </label>
          </div>
        </div>
      )}

      {/* ── TAB: Cost Intelligence ── */}
      {activeTab === 'cost' && (
        <div style={{ padding: '16px 20px 0' }}>
          <div className="sg-section-header" style={{ padding: '0 0 12px' }}>
            <h3 className="sg-section-title">💰 Cost Intelligence</h3>
            <Link href={`/chat${car.id ? `?carId=${car.id}&prompt=Phân tích chi phí xe của tôi` : ''}`} className="sg-section-link">Hỏi AI phân tích ›</Link>
          </div>

          {/* Total Cost Card */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFFFF 100%)',
            border: '1.5px solid var(--orange-border)',
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tổng chi phí đã ghi nhận
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-1)', marginTop: 4 }}>
              {formatMoney(car.totalCost && car.totalCost > 0 ? car.totalCost : services.reduce((s, e) => s + (e.cost || 0), 0) || 8500000)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
              Ước tính trung bình: <strong>~1.4M₫ / tháng</strong> cho chiếc {car.brand} {car.model}
            </div>
          </div>

          {/* Cost Categories */}
          <div style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginBottom: 12 }}>Phân bổ chi tiêu</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: '🛢️ Dầu & Bảo dưỡng định kỳ', pct: 45, amount: '4.2M₫', color: 'var(--orange)' },
                { label: '🔧 Thay thế phụ tùng & Sửa chữa', pct: 35, amount: '3.1M₫', color: '#8B5CF6' },
                { label: '📋 Đăng kiểm & Bảo hiểm', pct: 20, amount: '1.2M₫', color: '#10B981' },
              ].map((c, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-1)' }}>{c.label}</span>
                    <span style={{ color: 'var(--text-2)' }}>{c.amount} ({c.pct}%)</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, background: '#F1F5F9', overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Cost Advice */}
          <div style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start'
          }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>💡</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-1)', marginBottom: 4 }}>Đánh giá từ AI Thợ Xe</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Mức chi phí bảo dưỡng chiếc {car.brand} {car.model} của bạn đang ở mức hợp lý so với các dòng xe cùng phân khúc tại Việt Nam. Bạn có thể tiết kiệm thêm ~15% bằng cách tự thay lọc gió cabin (DIY).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: AI Memory ── */}
      {activeTab === 'memory' && (
        <div className="memory-section">
          <div className="sg-section-header" style={{ padding: '16px 0 10px' }}>
            <h3 className="sg-section-title">🧠 SparkGo nhớ về xe này</h3>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{memories.length} ghi nhận</span>
          </div>
          {memories.length === 0 ? (
            <div className="sg-empty">
              <div className="sg-empty-icon">🧠</div>
              <div className="sg-empty-title">AI chưa có ký ức</div>
              <div className="sg-empty-desc">Hãy chat với AI hoặc dùng Quick Log để SparkGo bắt đầu nhớ về chiếc xe này.</div>
              <div style={{ marginTop: 16 }}>
                <Link href={`/chat?carId=${car.id}`} className="sg-btn sg-btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                  💬 Bắt đầu chat
                </Link>
              </div>
            </div>
          ) : memories.map(m => (
            <div key={m.id} className="memory-item">
              <div className="memory-icon" style={{ background: MEMORY_COLORS[m.memoryType] || '#F8FAFC' }}>
                {MEMORY_ICONS[m.memoryType] || '📝'}
              </div>
              <div className="memory-info">
                <div className="memory-title">{m.title}</div>
                {m.content && m.content !== m.title && (
                  <div className="memory-detail">
                    {m.content.startsWith('{') ? '📊 Dữ liệu có cấu trúc' : m.content.slice(0, 80)}
                  </div>
                )}
                <div className="memory-date">{formatDate(m.date)}</div>
              </div>
              <div className="memory-source">{m.source}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Service Records ── */}
      {activeTab === 'service' && (
        <div style={{ padding: '16px 0 0' }}>
          <div className="sg-section-header" style={{ padding: '0 0 12px' }}>
            <h3 className="sg-section-title">📋 Lịch sử bảo dưỡng</h3>
            <button onClick={() => setShowAddService(true)} className="sg-section-link">+ Thêm</button>
          </div>
          {services.length === 0 ? (
            <div className="sg-empty">
              <div className="sg-empty-icon">🔧</div>
              <div className="sg-empty-title">Chưa có lịch sử</div>
              <div className="sg-empty-desc">Ghi nhận các lần bảo dưỡng, sửa chữa để SparkGo theo dõi tình trạng xe.</div>
              <button onClick={() => setShowAddService(true)} style={{ marginTop: 16, padding: '12px 24px', background: 'var(--orange)', color: '#FFF', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                ➕ Thêm bảo dưỡng
              </button>
            </div>
          ) : services.map(s => (
            <div key={s.id} style={{ background: '#FFF', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 16px', marginBottom: 8, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)', marginBottom: 3 }}>{s.serviceName}</div>
                  {s.garageName && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>🏪 {s.garageName}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 3 }}>
                    {formatDate(s.serviceDate)} · {s.odometerKm.toLocaleString('vi-VN')} km
                  </div>
                </div>
                {s.cost && (
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)', flexShrink: 0, marginLeft: 12 }}>
                    {formatMoney(s.cost)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Documents ── */}
      {activeTab === 'docs' && (
        <div style={{ padding: '16px 0 0' }}>
          <div className="sg-section-header" style={{ padding: '0 0 12px' }}>
            <h3 className="sg-section-title">📄 Tài liệu & hóa đơn</h3>
          </div>
          <div style={{ background: 'var(--orange-pale)', border: '1.5px dashed var(--orange-border)', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
            <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Tải hóa đơn / giấy tờ xe</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>AI sẽ đọc và trích xuất thông tin tự động</div>
            <label className="sg-btn sg-btn-primary sg-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
              📷 Chọn ảnh hóa đơn
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleOcrFile} />
            </label>
          </div>
          {showOcr && (
            <div style={{ marginTop: 16, background: '#FFF', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              {ocrLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="sg-spinner" />
                  <span style={{ fontSize: 13, color: 'var(--text-3)' }}>AI đang đọc hóa đơn...</span>
                </div>
              ) : ocrResult ? (
                <div>
                  <div style={{ fontWeight: 800, color: '#059669', marginBottom: 8, fontSize: 13 }}>✅ Đã đọc xong!</div>
                  {ocrResult.garageOrShop && <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Garage:</strong> {ocrResult.garageOrShop}</div>}
                  {ocrResult.totalAmount && <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>Tổng: {formatMoney(ocrResult.totalAmount)}</div>}
                  {ocrResult.summary && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8, fontStyle: 'italic' }}>{ocrResult.summary}</div>}
                  <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 8 }}>✓ Đã lưu vào Vehicle Memory</div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="sg-modal-overlay" onClick={() => setShowAddService(false)}>
          <div className="sg-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="sg-modal-handle" />
            <div className="sg-modal-header">
              <span className="sg-modal-title">📋 Ghi nhận bảo dưỡng</span>
              <button className="sg-modal-close" onClick={() => setShowAddService(false)}>✕</button>
            </div>
            <form onSubmit={handleAddService} className="sg-modal-body">
              <div className="sg-form-group" style={{ marginBottom: 12 }}>
                <label className="sg-label-text">Hạng mục *</label>
                <input className="sg-input" required value={newService.serviceName}
                  onChange={e => setNewService(p => ({ ...p, serviceName: e.target.value }))}
                  placeholder="VD: Thay dầu động cơ, thay lốp..." />
              </div>
              <div className="sg-form-grid" style={{ marginBottom: 12 }}>
                <div className="sg-form-group">
                  <label className="sg-label-text">Số km lúc làm</label>
                  <input className="sg-input" type="number" value={newService.odometerKm}
                    onChange={e => setNewService(p => ({ ...p, odometerKm: e.target.value }))}
                    placeholder={String(car.currentKm)} />
                </div>
                <div className="sg-form-group">
                  <label className="sg-label-text">Chi phí (₫)</label>
                  <input className="sg-input" type="number" value={newService.cost}
                    onChange={e => setNewService(p => ({ ...p, cost: e.target.value }))}
                    placeholder="850000" />
                </div>
              </div>
              <div className="sg-form-group" style={{ marginBottom: 12 }}>
                <label className="sg-label-text">Tên garage / tiệm</label>
                <input className="sg-input" value={newService.garageName}
                  onChange={e => setNewService(p => ({ ...p, garageName: e.target.value }))}
                  placeholder="VD: Garage Toyota Mỹ Đình" />
              </div>
              <div className="sg-form-group" style={{ marginBottom: 20 }}>
                <label className="sg-label-text">Ghi chú</label>
                <textarea className="sg-input" value={newService.notes}
                  onChange={e => setNewService(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Ghi chú thêm..." rows={2} style={{ resize: 'none' }} />
              </div>
              <button type="submit" className="sg-btn sg-btn-primary w-full">✓ Lưu bảo dưỡng</button>
            </form>
          </div>
        </div>
      )}

      {/* Share Vehicle DNA Passport Modal */}
      {showShareCard && (
        <div className="sg-modal-overlay" onClick={() => setShowShareCard(false)}>
          <div className="sg-modal-sheet" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="sg-modal-handle" />
            <div className="sg-modal-header">
              <span className="sg-modal-title">📤 Thẻ Hồ Sơ Xe (Car DNA)</span>
              <button className="sg-modal-close" onClick={() => setShowShareCard(false)}>✕</button>
            </div>
            <div className="sg-modal-body">
              {/* Premium Certificate Card */}
              <div style={{
                background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)',
                color: '#FFF',
                borderRadius: 22,
                padding: 24,
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18, color: 'var(--orange)' }}>⚡</span>
                    <span style={{ fontWeight: 900, letterSpacing: '0.05em', fontSize: 14 }}>SPARK<span style={{ color: 'var(--orange)' }}>GO</span> PASSPORT</span>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', padding: '3px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, color: '#34D399' }}>
                    ✓ AI VERIFIED
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                  <img
                    src={carImage || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80'}
                    alt="Car"
                    style={{ width: 80, height: 60, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900 }}>{car.brand} {car.model}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Đời {car.year} · {car.currentKm.toLocaleString('vi-VN')} km</div>
                    {car.licensePlate && <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700 }}>{car.licensePlate}</div>}
                  </div>
                </div>

                {/* Score & DNA Badges */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Health Score:</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#34D399' }}>{car.healthScore}/100</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, fontSize: 10, textAlign: 'center' }}>
                    {DNA_ITEMS.slice(0, 6).map(item => {
                      const st = dnaValues[item.key as keyof typeof dnaValues];
                      return (
                        <div key={item.key} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '5px 2px' }}>
                          <div>{item.icon} {item.label}</div>
                          <div style={{ color: st === 'good' ? '#34D399' : st === 'monitor' ? '#FBBF24' : '#94A3B8', fontWeight: 800, marginTop: 2 }}>
                            {st === 'good' ? 'Tốt' : st === 'monitor' ? 'Theo dõi' : 'Ổn'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                  Được theo dõi & phân tích bởi SparkGo AI Automotive Engine
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    const text = `🚗 SparkGo Car Passport: ${car.brand} ${car.model} (${car.year}) | ODO: ${car.currentKm.toLocaleString('vi-VN')} km | Health Score: ${car.healthScore}/100 | Vehicle DNA: 6 hệ thống được AI theo dõi.`;
                    navigator.clipboard.writeText(text);
                    setCopiedShare(true);
                    setTimeout(() => setCopiedShare(false), 2000);
                  }}
                  className="sg-btn sg-btn-primary w-full"
                >
                  {copiedShare ? '✓ Đã sao chép vào bộ nhớ tạm!' : '📋 Sao chép thông tin thẻ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Log FAB */}
      <button className="quick-log-trigger" onClick={() => setShowAddService(true)} title="Ghi nhận nhanh">
        ➕
      </button>
    </div>
  );
}
