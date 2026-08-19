'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface TimelineEntry {
  id: string;
  date: string;
  type: string;
  title: string;
  detail?: string;
  cost?: number;
  garage?: string;
  km?: number;
  source?: string;
}

type FilterType = 'all' | 'maintenance' | 'repair' | 'parts' | 'chat' | 'note';

const TYPE_CONFIG: Record<string, { icon: string; color: string; bgCls: string; label: string }> = {
  oil_change:   { icon: '🛢️', color: '#D97706', bgCls: 'timeline-icon-oil',        label: 'Thay dầu' },
  tire:         { icon: '⭕',  color: '#3B82F6', bgCls: 'timeline-icon-parts',      label: 'Lốp xe' },
  brake:        { icon: '🛞',  color: '#DC2626', bgCls: 'timeline-icon-repair',     label: 'Phanh' },
  battery:      { icon: '🔋',  color: '#059669', bgCls: 'timeline-icon-parts',      label: 'Ắc quy' },
  repair:       { icon: '🔧',  color: '#EF4444', bgCls: 'timeline-icon-repair',     label: 'Sửa chữa' },
  parts:        { icon: '⚙️',  color: '#8B5CF6', bgCls: 'timeline-icon-parts',      label: 'Phụ tùng' },
  inspection:   { icon: '📋',  color: '#2563EB', bgCls: 'timeline-icon-inspection', label: 'Đăng kiểm' },
  insurance:    { icon: '🛡️',  color: '#059669', bgCls: 'timeline-icon-inspection', label: 'Bảo hiểm' },
  symptom:      { icon: '⚠️',  color: '#F59E0B', bgCls: 'timeline-icon-note',       label: 'Triệu chứng' },
  note:         { icon: '📝',  color: '#64748B', bgCls: 'timeline-icon-note',       label: 'Ghi chú' },
  coolant:      { icon: '💧',  color: '#06B6D4', bgCls: 'timeline-icon-parts',      label: 'Nước làm mát' },
  ac:           { icon: '❄️',  color: '#3B82F6', bgCls: 'timeline-icon-parts',      label: 'Điều hòa' },
  chat:         { icon: '💬',  color: '#FF5500', bgCls: 'timeline-icon-ai',         label: 'AI Chat' },
  maintenance:  { icon: '🔩',  color: '#8B5CF6', bgCls: 'timeline-icon-parts',      label: 'Bảo dưỡng' },
  insight:      { icon: '💡',  color: '#F59E0B', bgCls: 'timeline-icon-ai',         label: 'AI Insight' },
  other:        { icon: '🔧',  color: '#64748B', bgCls: 'timeline-icon-note',       label: 'Khác' },
};

function getTypeConf(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other;
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
}

function getYear(d: string) {
  try { return new Date(d).getFullYear(); } catch { return 2025; }
}

function formatMoney(n?: number) {
  if (!n) return null;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M₫`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K₫`;
  return `${n.toLocaleString('vi-VN')}₫`;
}

export default function HistoryPage() {
  const { data: session } = useSession();
  const [memories, setMemories] = useState<TimelineEntry[]>([]);
  const [services, setServices] = useState<TimelineEntry[]>([]);
  const [sessions, setSessions] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [carName, setCarName] = useState('');
  const [carId, setCarId] = useState('');

  useEffect(() => {
    const savedCar = localStorage.getItem('sparkgo_car');
    if (savedCar) {
      try {
        const c = JSON.parse(savedCar);
        setCarName(`${c.brand} ${c.model}`);
        setCarId(c.id || '');
      } catch {}
    }

    if (session?.user) {
      const localCar = savedCar ? JSON.parse(savedCar) : null;
      const cid = localCar?.id;

      Promise.all([
        cid ? fetch(`/api/memory?carId=${cid}`).then(r => r.json()) : Promise.resolve([]),
        cid ? fetch(`/api/services?carId=${cid}`).then(r => r.json()) : Promise.resolve([]),
        fetch('/api/sessions').then(r => r.json()),
      ]).then(([memData, svcData, sesData]) => {
        // Memories
        if (Array.isArray(memData)) {
          setMemories(memData.map((m: any) => ({
            id: m.id, date: m.date || m.createdAt,
            type: m.memoryType, title: m.title,
            detail: m.content?.startsWith('{') ? undefined : m.content,
            source: m.source,
          })));
        }
        // Service records
        if (Array.isArray(svcData)) {
          setServices(svcData.map((s: any) => ({
            id: s.id, date: s.serviceDate,
            type: s.serviceType || 'maintenance',
            title: s.serviceName,
            detail: s.notes,
            cost: s.cost, garage: s.garageName, km: s.odometerKm,
            source: 'service_record',
          })));
        }
        // Chat sessions
        if (Array.isArray(sesData)) {
          setSessions(sesData.slice(0, 10).map((s: any) => ({
            id: s.id, date: s.createdAt,
            type: 'chat', title: s.title || 'Cuộc trò chuyện',
            detail: s.car ? `${s.car.brand} ${s.car.model}` : undefined,
            source: 'chat',
          })));
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  // Combine and sort all timeline entries
  const allEntries = useMemo(() => {
    const combined = [...memories, ...services, ...sessions];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memories, services, sessions]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allEntries;
    if (filter === 'maintenance') return allEntries.filter(e => ['oil_change', 'tire', 'brake', 'battery', 'coolant', 'ac', 'maintenance', 'inspection'].includes(e.type));
    if (filter === 'repair') return allEntries.filter(e => ['repair', 'symptom'].includes(e.type));
    if (filter === 'parts') return allEntries.filter(e => ['parts'].includes(e.type));
    if (filter === 'chat') return allEntries.filter(e => e.type === 'chat');
    if (filter === 'note') return allEntries.filter(e => ['note', 'insight', 'other'].includes(e.type));
    return allEntries;
  }, [allEntries, filter]);

  // Group by year
  const grouped = useMemo(() => {
    const map = new Map<number, TimelineEntry[]>();
    filtered.forEach(e => {
      const y = getYear(e.date);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filtered]);

  // Total cost
  const totalCost = useMemo(() => services.reduce((s, e) => s + (e.cost || 0), 0), [services]);

  return (
    <div className="history-page">
      {/* Header */}
      <div className="sg-header">
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>📜 Car Journal</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            {carName || 'Nhật ký xe'} · {filtered.length} sự kiện
          </div>
        </div>
        <Link href="/garage" style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
          + Thêm
        </Link>
      </div>

      {/* Stats pills */}
      {(services.length > 0 || memories.length > 0) && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--orange-pale)', border: '1px solid var(--orange-border)', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>
            📊 {allEntries.length} sự kiện
          </div>
          {totalCost > 0 && (
            <div style={{ background: 'var(--green-pale)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 999, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#059669' }}>
              💰 Tổng {formatMoney(totalCost)}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 20px 0', overflowX: 'auto' }}>
        {([
          { key: 'all',         label: 'Tất cả' },
          { key: 'maintenance', label: '🔧 Bảo dưỡng' },
          { key: 'repair',      label: '⚠️ Sửa chữa' },
          { key: 'chat',        label: '💬 AI Chat' },
          { key: 'note',        label: '📝 Ghi chú' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 999,
              fontSize: 12, fontWeight: 700, border: '1.5px solid',
              borderColor: filter === f.key ? 'var(--orange)' : 'var(--border)',
              background: filter === f.key ? 'var(--orange)' : '#FFF',
              color: filter === f.key ? '#FFF' : 'var(--text-2)',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="sg-spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="sg-empty" style={{ padding: '48px 20px' }}>
          <div className="sg-empty-icon">📜</div>
          <div className="sg-empty-title">Chưa có ghi nhận nào</div>
          <div className="sg-empty-desc" style={{ marginBottom: 20 }}>
            Nhật ký xe sẽ tự động cập nhật khi bạn dùng AI chat hoặc ghi nhận bảo dưỡng.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={carId ? `/chat?carId=${carId}` : '/chat'} style={{ padding: '12px 20px', background: 'var(--orange)', color: '#FFF', borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              💬 Chat với AI
            </Link>
            <Link href="/garage" style={{ padding: '12px 20px', background: '#FFF', border: '1.5px solid var(--border)', color: 'var(--text-1)', borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              🔧 Ghi bảo dưỡng
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 20px' }}>
          {grouped.map(([year, entries]) => (
            <div key={year}>
              <div className="timeline-year">{year}</div>
              <div className="timeline">
                {entries.map((entry, idx) => {
                  const conf = getTypeConf(entry.type);
                  return (
                    <div key={entry.id} className="timeline-item">
                      <div className={`timeline-icon-wrap ${conf.bgCls}`} style={{ background: undefined }}>
                        {conf.icon}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-content-title">{entry.title}</div>
                        <div className="timeline-content-meta">
                          {formatDate(entry.date)}
                          {entry.km && ` · ${entry.km.toLocaleString('vi-VN')} km`}
                          {entry.garage && ` · ${entry.garage}`}
                        </div>
                        {entry.detail && (
                          <div className="timeline-content-detail">{entry.detail}</div>
                        )}
                        {entry.cost && (
                          <div className="timeline-content-cost">{formatMoney(entry.cost)}</div>
                        )}
                        {entry.type === 'chat' && (
                          <Link
                            href={`/chat?sessionId=${entry.id}`}
                            style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 700, marginTop: 4, display: 'inline-block', textDecoration: 'none' }}
                          >
                            Xem cuộc trò chuyện ›
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
