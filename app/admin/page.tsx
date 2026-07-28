'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface AdminStats {
  summary: {
    totalUsers: number;
    totalCars: number;
    totalSessions: number;
    totalMessages: number;
  };
  recentUsers: any[];
  recentCars: any[];
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (data?.summary) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">⚡</div>
            Spark<span>Go</span>
          </Link>
          <span style={{ fontSize: '0.82rem', background: 'rgba(239,68,68,0.15)', color: '#F87171', padding: '3px 10px', borderRadius: 100, fontWeight: 700 }}>
            👑 Admin Dashboard
          </span>
        </div>
        <div className="navbar-actions">
          <Link href="/garage" className="btn btn-outline btn-sm">🚘 Gara xe</Link>
          <Link href="/chat" className="btn btn-primary btn-sm">💬 AI Chat</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 'calc(var(--nav-height) + 24px)', paddingBottom: 80, maxWidth: 1100, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-1)', marginBottom: 4 }}>
            📊 Quản Trị Hệ Thống & Khách Hàng (Admin Console)
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
            Theo dõi sự tăng trưởng người dùng, số lượng xe đăng ký và chỉ số hoạt động AI thợ xe.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-2)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Đang tải dữ liệu quản trị...
          </div>
        ) : !stats ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
              Vui lòng đăng nhập quyền Admin
            </h2>
            <Link href="/login" className="btn btn-primary">🔑 Đăng nhập</Link>
          </div>
        ) : (
          <>
            {/* Overview Metric Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'TỔNG NGUỜI DÙNG', value: stats.summary.totalUsers.toLocaleString('vi-VN'), icon: '👥', color: '#F5C518' },
                { label: 'HỒ SƠ XE ĐÃ ĐĂNG KÝ', value: stats.summary.totalCars.toLocaleString('vi-VN'), icon: '🚗', color: '#10B981' },
                { label: 'PHIÊN TRÒ CHUYỆN AI', value: stats.summary.totalSessions.toLocaleString('vi-VN'), icon: '💬', color: '#F59E0B' },
                { label: 'TIN NHẮN & FILE', value: stats.summary.totalMessages.toLocaleString('vi-VN'), icon: '📨', color: '#8B5CF6' },
              ].map((w, idx) => (
                <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `${w.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                    {w.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.05em' }}>
                      {w.label}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.1, marginTop: 2 }}>
                      {w.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
              {/* Recent Registered Users */}
              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👥 Khách Hàng Mới Nhất</span>
                  <span style={{ fontSize: '0.78rem', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 100 }}>{stats.recentUsers.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.recentUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {u.image ? (
                          <img src={u.image} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                            {u.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-1)' }}>
                            {u.name || 'Khách hàng'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                            {u.email || 'No email'} · {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-2)' }}>
                        <div>🚗 <strong>{u._count.cars}</strong> xe</div>
                        <div>💬 <strong>{u._count.chatSessions}</strong> phiên chat</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Registered Cars */}
              <div className="card">
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🚗 Danh Sách Xe Trong Hệ Thống</span>
                  <span style={{ fontSize: '0.78rem', background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 100 }}>{stats.recentCars.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stats.recentCars.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-1)' }}>
                          🚗 {c.brand} {c.model} ({c.year})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                          Chủ xe: {c.user?.name || c.user?.email || 'N/A'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--accent-light)' }}>
                          {c.currentKm.toLocaleString('vi-VN')} km
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          {c.fuelType === 'petrol' ? 'Xăng' : c.fuelType === 'diesel' ? 'Diesel' : c.fuelType === 'hybrid' ? 'Hybrid' : 'Điện'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
