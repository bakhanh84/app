'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { calculateMaintenance, MaintenanceItem } from '@/lib/maintenance';
import { getCarImageUrl } from '@/lib/car-images';


interface ServiceRecordItem {
  id: string;
  serviceDate: string;
  odometerKm: number;
  serviceName: string;
  garageName?: string;
  cost?: number;
  notes?: string;
}

export default function GaragePage() {
  const { data: session } = useSession();
  const [cars, setCars] = useState<any[]>([]);
  const [activeCar, setActiveCar] = useState<any | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form for adding service record
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    serviceName: 'Thay dầu động cơ & lọc dầu',
    odometerKm: 45000,
    garageName: 'Gara Toyota Mỹ Đình',
    cost: '850000',
    notes: 'Thay dầu 합성 5W-30',
  });

  useEffect(() => {
    const savedCar = localStorage.getItem('sparkgo_car');
    let localParsed: any = null;
    if (savedCar) {
      try { localParsed = JSON.parse(savedCar); } catch {}
    }

    if (session?.user) {
      fetch('/api/cars')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setCars(data);
            setActiveCar(data[0]);
            fetchServiceRecords(data[0].id);
          } else if (localParsed) {
            setCars([localParsed]);
            setActiveCar(localParsed);
          }
          setLoading(false);
        })
        .catch(() => {
          if (localParsed) {
            setCars([localParsed]);
            setActiveCar(localParsed);
          }
          setLoading(false);
        });
    } else {
      if (localParsed) {
        setCars([localParsed]);
        setActiveCar(localParsed);
      }
      setLoading(false);
    }
  }, [session]);

  const fetchServiceRecords = (carId: string) => {
    fetch(`/api/services?carId=${carId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setServiceRecords(data);
      })
      .catch(() => {});
  };

  const handleSelectCar = (c: any) => {
    setActiveCar(c);
    if (c.id) fetchServiceRecords(c.id);
  };

  const handleAddServiceRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCar?.id) {
      alert('Vui lòng đăng nhập để lưu nhật ký bảo dưỡng vào cơ sở dữ liệu!');
      return;
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId: activeCar.id,
          ...newRecord,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchServiceRecords(activeCar.id);
        // Refresh car list
        const updatedKm = parseInt(String(newRecord.odometerKm));
        if (updatedKm > activeCar.currentKm) {
          setActiveCar((prev: any) => ({ ...prev, currentKm: updatedKm }));
        }
      } else {
        alert('Lỗi lưu nhật ký bảo dưỡng.');
      }
    } catch {
      alert('Lỗi kết nối.');
    }
  };

  const printServiceBook = () => {
    window.print();
  };

  // Maintenance items for health calculation
  const maintenanceItems: MaintenanceItem[] = activeCar
    ? calculateMaintenance(activeCar)
    : [];


  const overdueCount = maintenanceItems.filter(i => i.urgency === 'overdue').length;
  const soonCount = maintenanceItems.filter(i => i.urgency === 'soon').length;

  // Calculate Health Score (100 minus penalty)
  const healthScore = Math.max(20, 100 - (overdueCount * 20) - (soonCount * 8));

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">⚡</div>
            Spark<span>Go</span>
          </Link>
          <span style={{ fontSize: '0.82rem', background: 'var(--accent-muted)', color: 'var(--accent-light)', padding: '3px 10px', borderRadius: 100, fontWeight: 700 }}>
            🚘 Gara Điện Tử v3.0
          </span>
        </div>
        <div className="navbar-actions">
          <Link href="/chat" className="btn btn-primary btn-sm">💬 Thợ Xe AI</Link>
          <Link href="/calendar" className="btn btn-ghost btn-sm">📅 Lịch bảo dưỡng</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 'calc(var(--nav-height) + 24px)', paddingBottom: 80, maxWidth: 1000, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        {/* Top Garage Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>
              🏢 Gara Xe Điện Tử
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
              Quản lý hồ sơ xe, theo dõi sức khỏe xe 24/7 và nhật ký sửa chữa chuẩn quốc tế.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={printServiceBook} className="btn btn-outline">
              📄 In Sổ Bảo Dưỡng PDF
            </button>
            <Link href="/onboarding" className="btn btn-primary">
              + Thêm xe mới
            </Link>
          </div>
        </div>

        {/* Car Selector Tabs */}
        {cars.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {cars.map(c => (
              <button
                key={c.id || c.model}
                onClick={() => handleSelectCar(c)}
                className={`btn btn-sm ${activeCar?.id === c.id || activeCar?.model === c.model ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: 100 }}
              >
                🚗 {c.brand} {c.model} ({c.year})
              </button>
            ))}
          </div>
        )}

        {!activeCar ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🚗</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Chưa có xe trong Gara
            </h2>
            <p style={{ color: 'var(--text-2)', marginBottom: 20, fontSize: '0.88rem' }}>
              Tạo hồ sơ xe điện tử để AI theo dõi sức khỏe xe của bạn.
            </p>
            <Link href="/onboarding" className="btn btn-primary btn-lg">
              + Thêm xe ngay
            </Link>
          </div>
        ) : (
          <>
            {/* Car Photo Banner */}
            <div className="card" style={{
              position: 'relative',
              height: 180,
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 20,
              backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.3) 60%), url('${getCarImageUrl(activeCar.brand, activeCar.model, activeCar.year)}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: 20,
            }}>
              <div>
                <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid #10B981', color: '#34D399', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
                  HỒ SƠ XE CHÍNH CHỦ
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', margin: '4px 0 2px 0', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {activeCar.brand} {activeCar.model}
                </h2>
                <div style={{ fontSize: '0.85rem', color: '#E2E8F0', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  Năm sản xuất: <strong>{activeCar.year}</strong> · Biển số: <strong>{activeCar.licensePlate || 'Chưa nhập'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 28 }}>
              {/* Health Score Card */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(20,30,48,0.9) 0%, rgba(13,25,46,0.95) 100%)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SỨC KHỎE XE TỔNG QUAN
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-1)', marginTop: 4 }}>
                    {activeCar.brand} {activeCar.model}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                    Năm {activeCar.year} · {activeCar.licensePlate ? `Biển: ${activeCar.licensePlate}` : 'Chưa nhập biển số'}
                  </div>
                </div>

                {/* Score Ring Badge */}
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: healthScore > 80 ? 'rgba(52,211,153,0.15)' : healthScore > 60 ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                  border: `3px solid ${healthScore > 80 ? '#34D399' : healthScore > 60 ? '#FBBF24' : '#F87171'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: healthScore > 80 ? '#34D399' : healthScore > 60 ? '#FBBF24' : '#F87171', lineHeight: 1 }}>
                    {healthScore}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', fontWeight: 700 }}>/ 100 điểm</div>
                </div>
              </div>

              {/* Status Summary Pill */}
              <div style={{ background: 'var(--bg-surface)', borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Tình trạng bảo dưỡng:</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: overdueCount > 0 ? 'var(--danger)' : soonCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
                    {overdueCount > 0 ? `⚠️ Có ${overdueCount} hạng mục quá hạn!` : soonCount > 0 ? `🔔 Có ${soonCount} hạng mục cần làm sớm` : '✅ Tất cả hạng mục đạt chuẩn'}
                  </div>
                </div>
                <Link href="/chat" className="btn btn-outline btn-sm">
                  Hỏi AI →
                </Link>
              </div>
            </div>

            {/* Smart Odometer Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  ⏱️ ĐỒNG HỒ SỐ KM & DỰ BÁO TỰ ĐỘNG
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-light)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {(activeCar.currentKm || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '1rem', color: 'var(--text-2)' }}>km</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 8 }}>
                  Dự báo chạy trung bình: <strong>~{activeCar.dailyKmAvg || 35} km/ngày</strong>
                </div>
              </div>

              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Nhiên liệu</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                    {activeCar.fuelType === 'petrol' ? '⛽ Xăng' : activeCar.fuelType === 'diesel' ? '🛢️ Diesel' : activeCar.fuelType === 'hybrid' ? '🔋 Hybrid' : '⚡ Điện'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Hộp số</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                    {activeCar.transmission === 'auto' ? '🔄 Tự động' : '⚙️ Số sàn'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Digital Service History Section */}
      {activeCar && (
        <div className="card" style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)' }}>
                📜 Sổ Bảo Dưỡng Điện Tử (Service History Log)
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>
                Ghi chép toàn bộ lần thay dầu, sửa chữa tại garage để minh bạch lịch sử và giữ giá xe.
              </p>
            </div>

            {session?.user && (
              <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
                + Thêm nhật ký sửa chữa
              </button>
            )}
          </div>

          {serviceRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-surface)', borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
                Chưa có nhật ký bảo dưỡng nào
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 16 }}>
                Bấm nút bên dưới để khai báo thông tin thay dầu hay sửa xe gần đây nhất.
              </div>
              {session?.user ? (
                <button onClick={() => setShowAddModal(true)} className="btn btn-outline btn-sm">
                  + Thêm nhật ký bảo dưỡng đầu tiên
                </button>
              ) : (
                <Link href="/login" className="btn btn-primary btn-sm">
                  🔑 Đăng nhập để lưu nhật ký
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-3)', fontSize: '0.78rem' }}>
                    <th style={{ padding: '10px 12px' }}>NGÀY</th>
                    <th style={{ padding: '10px 12px' }}>SỐ KM</th>
                    <th style={{ padding: '10px 12px' }}>NỘI DUNG DỊCH VỤ</th>
                    <th style={{ padding: '10px 12px' }}>GARAGE / XƯỞNG</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>CHI PHÍ (VND)</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRecords.map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-2)' }}>
                        {new Date(r.serviceDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 700, color: 'var(--accent-light)' }}>
                        {r.odometerKm.toLocaleString('vi-VN')} km
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-1)' }}>
                        {r.serviceName}
                        {r.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 400 }}>{r.notes}</div>}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-2)' }}>
                        {r.garageName || '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-1)' }}>
                        {r.cost ? `${r.cost.toLocaleString('vi-VN')} đ` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* Modal Add Service Record */}
        {showAddModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 16,
          }}>
            <div className="card animate-fadeInUp" style={{ maxWidth: 480, width: '100%', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                  📝 Thêm Nhật Ký Bảo Dưỡng
                </h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleAddServiceRecord} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Tên hạng mục / dịch vụ *</label>
                  <input
                    className="form-input"
                    value={newRecord.serviceName}
                    onChange={e => setNewRecord(p => ({ ...p, serviceName: e.target.value }))}
                    placeholder="Ví dụ: Thay dầu động cơ 5W-30 & lọc dầu"
                    required
                  />
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-label">Số km tại thời điểm đó *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRecord.odometerKm}
                      onChange={e => setNewRecord(p => ({ ...p, odometerKm: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Chi phí (VND)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRecord.cost}
                      onChange={e => setNewRecord(p => ({ ...p, cost: e.target.value }))}
                      placeholder="850000"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Tên Garage / Xưởng dịch vụ</label>
                  <input
                    className="form-input"
                    value={newRecord.garageName}
                    onChange={e => setNewRecord(p => ({ ...p, garageName: e.target.value }))}
                    placeholder="Ví dụ: Toyota Mỹ Đình, Garage Hà Nội..."
                  />
                </div>

                <div>
                  <label className="form-label">Ghi chú</label>
                  <textarea
                    className="form-textarea"
                    value={newRecord.notes}
                    onChange={e => setNewRecord(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Lại dầu Mobil 1 5W-30, thay cả đệm xả dầu..."
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Hủy</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu nhật ký</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
