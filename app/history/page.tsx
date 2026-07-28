'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface ChatSessionItem {
  id: string;
  title: string;
  theme: string;
  createdAt: string;
  updatedAt: string;
  car?: { brand: string; model: string; year: number };
  messages?: { content: string }[];
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Check if there is an active local chat
    const cachedMessages = localStorage.getItem('sparkgo_active_chat_messages');
    if (cachedMessages) {
      try {
        const parsed = JSON.parse(cachedMessages);
        if (parsed.length > 0) {
          setActiveSessionId('active_local');
        }
      } catch {}
    }

    if (session?.user) {
      fetch('/api/sessions')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSessions(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) return;

    try {
      const res = await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch {}
  };

  // Smart Date Grouping Logic
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const carText = s.car ? `${s.car.brand} ${s.car.model} ${s.car.year}`.toLowerCase() : '';
      return s.title.toLowerCase().includes(q) || carText.includes(q);
    });

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const groups: { title: string; icon: string; items: ChatSessionItem[] }[] = [
      { title: 'Hôm nay', icon: '🕒', items: [] },
      { title: 'Hôm qua', icon: '📅', items: [] },
      { title: '7 ngày qua', icon: '🗓️', items: [] },
      { title: 'Cũ hơn', icon: '📁', items: [] },
    ];

    filtered.forEach(s => {
      const d = new Date(s.updatedAt);
      const dStr = d.toDateString();

      if (dStr === todayStr) {
        groups[0].items.push(s);
      } else if (dStr === yesterdayStr) {
        groups[1].items.push(s);
      } else if (d > sevenDaysAgo) {
        groups[2].items.push(s);
      } else {
        groups[3].items.push(s);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [sessions, searchQuery]);

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
          <Link href="/chat" className="btn btn-primary btn-sm">💬 Quay lại Chat AI</Link>
        </div>
      </nav>

      <div style={{ paddingTop: 'calc(var(--nav-height) + 24px)', paddingBottom: 80, maxWidth: 900, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
              📜 Lịch Sử Tư Vấn
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
              Toàn bộ các cuộc trao đổi với AI thợ xe được tự động lưu trữ và phân loại theo thời gian.
            </p>
          </div>
          <Link href="/chat" className="btn btn-primary">
            + Cuộc trò chuyện mới
          </Link>
        </div>

        {/* Active Local Session Notification Banner */}
        {activeSessionId && (
          <div style={{
            background: 'var(--accent-muted)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 18px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>📌</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--accent-light)' }}>
                  Bạn đang có cuộc trao đổi dở dang!
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
                  Nội dung đang thảo luận được tự động giữ nguyên.
                </div>
              </div>
            </div>
            <Link href="/chat" className="btn btn-primary btn-sm">
              Tiếp tục chat →
            </Link>
          </div>
        )}

        {/* Search Bar */}
        {session?.user && sessions.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              className="chat-textarea"
              placeholder="🔍 Tìm kiếm cuộc trò chuyện theo từ khóa hoặc tên xe..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-1)',
                fontSize: '0.9rem',
              }}
            />
          </div>
        )}

        {/* Content */}
        {!session?.user ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
              Đăng nhập để đồng bộ lịch sử trên mọi thiết bị
            </h2>
            <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 24px' }}>
              Khi đăng nhập bằng Google, toàn bộ lịch sử tư vấn và hồ sơ xe của bạn sẽ được lưu bảo mật trong cơ sở dữ liệu.
            </p>
            <Link href="/login" className="btn btn-primary btn-lg">
              🔑 Đăng nhập bằng Google
            </Link>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-2)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Đang tải lịch sử tư vấn...
          </div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-1)' }}>
              Chưa có lịch sử cuộc trò chuyện
            </h2>
            <p style={{ color: 'var(--text-2)', marginBottom: 24, fontSize: '0.88rem' }}>
              Hãy hỏi AI thợ xe bất kỳ thắc mắc nào về chiếc xe của bạn.
            </p>
            <Link href="/chat" className="btn btn-primary btn-lg">
              🚀 Bắt đầu trò chuyện ngay
            </Link>
          </div>
        ) : groupedSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-2)' }}>
            Không tìm thấy cuộc trò chuyện nào khớp với "{searchQuery}".
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {groupedSessions.map(group => (
              <div key={group.title}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{group.icon}</span>
                  <span>{group.title}</span>
                  <span style={{ background: 'var(--bg-surface)', padding: '2px 8px', borderRadius: 100, fontSize: '0.75rem' }}>{group.items.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.items.map(s => (
                    <div
                      key={s.id}
                      onClick={() => window.location.href = `/chat?sessionId=${s.id}`}
                      className="card animate-fadeInUp"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',

                        padding: '16px 20px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-1)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>💬 {s.title}</span>
                          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: s.theme === 'pro' ? 'rgba(47,128,255,0.15)' : 'rgba(255,107,53,0.15)', color: s.theme === 'pro' ? 'var(--accent)' : 'var(--accent-light)' }}>
                            {s.theme === 'pro' ? '🔧 Thầy Hùng' : '🤝 Minh'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {s.car && (
                            <span>🚗 {s.car.brand} {s.car.model} {s.car.year}</span>
                          )}
                          <span>🕒 {new Date(s.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          onClick={e => deleteSession(s.id, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-3)',
                            padding: 8,
                            fontSize: 16,
                            borderRadius: 6,
                          }}
                          title="Xóa cuộc trò chuyện"
                        >
                          🗑️
                        </button>
                        <span style={{ fontSize: 18, color: 'var(--text-3)' }}>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
