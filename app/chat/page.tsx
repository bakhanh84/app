'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AITheme, QUICK_PROMPTS_PRO, QUICK_PROMPTS_FRIENDLY } from '@/lib/gemini';
import { CarProfile } from '@/lib/maintenance';
import { getCarImageUrl } from '@/lib/car-images';

interface Attachment {
  url: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'file';
  mimeType: string;
  size?: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
  attachments?: Attachment[];
}

interface ChatSessionSummary {
  id: string;
  title: string;
  theme: string;
  updatedAt: string;
  car?: { brand: string; model: string; year: number };
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h3>$1</h3>')
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
    .trim();
}

function ChatContent() {

  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionIdParam = searchParams.get('sessionId');
  const carIdParam = searchParams.get('carId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionIdParam);
  const [sessionList, setSessionList] = useState<ChatSessionSummary[]>([]);
  const [userCars, setUserCars] = useState<CarProfile[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<AITheme>('pro');
  const [car, setCar] = useState<CarProfile | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);



  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `tieng-dong-xe-${Date.now()}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);
        setIsUploading(true);
        try {
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            setAttachments(prev => [...prev, data]);
          }
        } catch {}
        setIsUploading(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      alert('Không thể truy cập Micro. Vui lòng cấp quyền Micro trên điện thoại/máy tính của bạn!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sparkgo_')) {
          localStorage.removeItem(key);
        }
      });
    }
    await signOut({ callbackUrl: '/' });
  };



  // 1. Initial Load & Persistence Sync
  useEffect(() => {
    const savedTheme = localStorage.getItem('sparkgo_theme') as AITheme | null;
    if (savedTheme) setTheme(savedTheme);

    const savedCar = localStorage.getItem('sparkgo_car');
    if (savedCar) {
      try { setCar(JSON.parse(savedCar)); } catch { /* ignore */ }
    }

    // If user is authenticated, sync car & session list from DB strictly by activeCar.id
    if (session?.user) {
      fetch('/api/cars')
        .then(res => res.json())
        .then(dbCars => {
          if (Array.isArray(dbCars) && dbCars.length > 0) {
            setUserCars(dbCars);
            const matchedCar = carIdParam ? dbCars.find((c: any) => c.id === carIdParam) : undefined;
            const activeCar = matchedCar || dbCars[0];
            setCar(activeCar);
            localStorage.setItem('sparkgo_car', JSON.stringify(activeCar));

            // Fetch sessions SPECIFICALLY for activeCar
            if (!sessionIdParam && activeCar.id) {
              fetch(`/api/sessions?carId=${activeCar.id}`)
                .then(res => res.json())
                .then(carSessions => {
                  if (Array.isArray(carSessions) && carSessions.length > 0) {
                    setSessionList(carSessions);
                    const latestSession = carSessions[0];
                    setCurrentSessionId(latestSession.id);
                    fetch(`/api/sessions?id=${latestSession.id}`)
                      .then(r => r.json())
                      .then(sData => {
                        if (sData?.messages && sData.messages.length > 0) {
                          const formatted: Message[] = sData.messages.map((m: any) => ({
                            id: m.id,
                            role: m.role,
                            content: m.content,
                            attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
                          }));
                          setMessages(formatted);
                        }
                      })
                      .catch(() => {});
                  } else {
                    // No sessions for this car -> Clean welcome screen
                    setSessionList([]);
                    setCurrentSessionId(null);
                    setMessages([]);
                  }
                })
                .catch(() => {});
            }
          } else if (savedCar) {
            // Push local car to DB
            try {
              fetch('/api/cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: savedCar,
              });
            } catch {}
          }
        })
        .catch(() => {});
    }


    // Load active session from URL if explicitly provided
    if (sessionIdParam) {
      setCurrentSessionId(sessionIdParam);
      fetch(`/api/sessions?id=${sessionIdParam}`)
        .then(res => res.json())
        .then(data => {
          if (data?.messages) {
            const formatted: Message[] = data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
            }));
            setMessages(formatted);
          }
        }).catch(() => {});
    } else if (!session?.user) {
      // Restore guest/active chat from localStorage only for unauthenticated users
      const cachedMessages = localStorage.getItem('sparkgo_active_chat_messages');
      if (cachedMessages) {
        try { setMessages(JSON.parse(cachedMessages)); } catch {}
      }
    }



    // Handle pending question from calendar
    const pending = localStorage.getItem('sparkgo_pending_question');
    if (pending) {
      localStorage.removeItem('sparkgo_pending_question');
      setTimeout(() => {
        setInput(pending);
      }, 300);
    }
  }, [sessionIdParam, session]);

  // 2. Auto-save messages to localStorage whenever messages state changes!
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('sparkgo_active_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Start a fresh new chat session
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    localStorage.removeItem('sparkgo_active_chat_messages');
    router.push('/chat');
  };

  // Switch session
  const selectSession = (sid: string) => {
    setCurrentSessionId(sid);
    setShowHistoryDrawer(false);
    router.push(`/chat?sessionId=${sid}`);
  };

  // Handle file select and upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data: Attachment = await res.json();
          setAttachments(prev => [...prev, data]);
        } else {
          const err = await res.json();
          alert(err.error || 'Lỗi tải file');
        }
      } catch (err) {
        alert('Lỗi tải file. Vui lòng thử lại.');
      }
    }
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if ((!msg && attachments.length === 0) || isLoading) return;

    const currentAttachments = [...attachments];
    const userMsg: Message = {
      role: 'user',
      content: msg || (currentAttachments.length > 0 ? '[Đính kèm file]' : ''),
      id: Date.now().toString(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    // Build history for Gemini
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

    try {
      let activeSid = currentSessionId;
      // If logged in and no session ID exists, create one in DB
      if (session?.user && !activeSid) {
        try {
          const sRes = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carId: car?.id, theme }),
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            activeSid = sData.id;
            setCurrentSessionId(activeSid);
          }
        } catch {}
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg || 'Hãy xem file/ảnh/audio/video tôi gửi kèm và tư vấn giúp tôi.',
          history,
          car,
          theme,
          sessionId: activeSid,
          attachments: currentAttachments,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        let errorMsg = err.error || 'Có lỗi xảy ra.';
        if (errorMsg.includes('API key')) setHasApiKey(false);
        if (errorMsg.includes('quota') || errorMsg.includes('429')) {
          errorMsg = '⚠️ Gemini API đang bận (rate limit). Vui lòng thử lại sau 30 giây.';
        }
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: errorMsg } : m)
        );
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const final = accumulated;
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: final } : m)
        );
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Lỗi kết nối. Kiểm tra lại kết nối mạng.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, car, theme, attachments, session, currentSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchTheme = (t: AITheme) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('sparkgo_theme', t);
  };

  const quickPrompts = theme === 'pro' ? QUICK_PROMPTS_PRO : QUICK_PROMPTS_FRIENDLY;
  const aiName = theme === 'pro' ? 'Thầy Hùng' : 'Minh';
  const aiAvatar = theme === 'pro' ? '🔧' : '🤝';

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">⚡</div>
            Spark<span>Go</span>
          </Link>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="btn btn-outline btn-sm"
            style={{ borderRadius: 100, padding: '4px 12px', fontSize: '0.78rem' }}
            title="Bắt đầu đoạn chat mới"
          >
            + Chat mới
          </button>
        </div>

        <div className="navbar-actions">
          <div className="theme-toggle">
            <button className={`theme-toggle-btn${theme === 'pro' ? ' active' : ''}`} onClick={() => switchTheme('pro')}>🔧 Pro</button>
            <button className={`theme-toggle-btn${theme === 'friendly' ? ' active' : ''}`} onClick={() => switchTheme('friendly')}>🤝 Friendly</button>
          </div>

          <Link href="/calendar" className="btn btn-ghost btn-sm">📅 Lịch bảo dưỡng</Link>

          {session?.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ''} style={{ width: 30, height: 30, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <button onClick={handleSignOut} className="btn btn-outline btn-sm">🚪 Thoát</button>

            </div>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">🔑 Đăng nhập</Link>
          )}
        </div>
      </nav>

      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="api-key-banner" style={{ marginTop: 64 }}>
          <span className="api-key-banner-icon">⚠️</span>
          <span className="api-key-banner-text">
            Chưa có Gemini API key. Thêm key vào file <code>.env.local</code> rồi restart server.{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">
              Lấy key miễn phí tại đây →
            </a>
          </span>
        </div>
      )}

      <div className="chat-layout" style={!hasApiKey ? { paddingTop: 'calc(var(--nav-height) + 56px)' } : undefined}>
        {/* Sidebar */}
        <aside className="chat-sidebar">
          {/* AI Info */}
          <div className="car-info-card">
            <div className="car-info-card-header">
              <div className="car-info-icon">{aiAvatar}</div>
              <div>
                <div className="car-info-name">{aiName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Đang online</div>
              </div>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
              {theme === 'pro'
                ? 'Thợ xe kỳ cựu 20 năm. Tư vấn thẳng thắn, chuyên nghiệp.'
                : 'Người bạn am hiểu xe. Tư vấn thân thiện, dễ hiểu.'}
            </div>
          </div>

          {/* Car Info & Quick Fleet Switcher */}
          {car ? (
            <div className="car-info-card">
              {/* Quick Car Selector if user has multiple cars */}
              {userCars.length > 1 && (
                <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>
                    🚘 ĐỔI XE ĐANG TƯ VẤN ({userCars.length}/5):
                  </div>
                  <select
                    value={(car as any)?.id || ''}
                    onChange={e => {
                      const selected = userCars.find((c: any) => c.id === e.target.value);
                      if (selected) {
                        setCar(selected);
                        localStorage.setItem('sparkgo_car', JSON.stringify(selected));

                        // Fetch sessions for this selected car
                        if (session?.user && selected.id) {
                          fetch(`/api/sessions?carId=${selected.id}`)
                            .then(res => res.json())
                            .then(carSessions => {
                              if (Array.isArray(carSessions) && carSessions.length > 0) {
                                setSessionList(carSessions);
                                const latest = carSessions[0];
                                setCurrentSessionId(latest.id);
                                fetch(`/api/sessions?id=${latest.id}`)
                                  .then(r => r.json())
                                  .then(sData => {
                                    if (sData?.messages) {
                                      const formatted: Message[] = sData.messages.map((m: any) => ({
                                        id: m.id,
                                        role: m.role,
                                        content: m.content,
                                        attachments: m.attachments ? JSON.parse(m.attachments) : undefined,
                                      }));
                                      setMessages(formatted);
                                    }
                                  });
                              } else {
                                // No sessions for this car yet -> Show clean welcome screen
                                setSessionList([]);
                                setCurrentSessionId(null);
                                setMessages([]);
                              }
                            });
                        } else {
                          setMessages([]);
                          setCurrentSessionId(null);
                        }
                      }
                    }}

                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'var(--bg-surface)',
                      color: 'var(--text-1)',
                      border: '1px solid var(--border)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    {userCars.map((c: any) => (
                      <option key={c.id || c.model} value={c.id}>
                        🚗 {c.brand} {c.model} ({c.year})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="car-info-card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 54,
                  height: 40,
                  borderRadius: 8,
                  backgroundImage: `url('${getCarImageUrl(car.brand, car.model, car.year)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }} />
                <div>
                  <div className="car-info-name" style={{ fontWeight: 800 }}>{car.brand} {car.model}</div>
                  <div className="car-info-year" style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>Năm sản xuất: {car.year}</div>
                </div>
              </div>

              {[
                { label: 'Số km', value: `${car.currentKm.toLocaleString('vi-VN')} km` },
                { label: 'Nhiên liệu', value: car.fuelType === 'petrol' ? 'Xăng' : car.fuelType === 'diesel' ? 'Diesel' : car.fuelType === 'hybrid' ? 'Hybrid' : 'Điện' },
                { label: 'Hộp số', value: car.transmission === 'auto' ? 'Tự động' : 'Số sàn' },
              ].map(({ label, value }) => (
                <div key={label} className="car-info-row">
                  <span className="car-info-label">{label}</span>
                  <span className="car-info-value">{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12 }}>
                <Link href="/onboarding" className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  ✏️ Chỉnh sửa xe
                </Link>
              </div>
            </div>
          ) : (
            <div className="car-info-card">
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🚗</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 12 }}>
                  Thêm xe để AI tư vấn chính xác hơn
                </div>
                <Link href="/onboarding" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                  + Thêm xe
                </Link>
              </div>
            </div>
          )}

          {/* Past Discussions List in Sidebar */}
          {sessionList.length > 0 && (
            <div>
              <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📜 Cuộc trò chuyện vừa qua</span>
                <Link href="/history" style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Tất cả →</Link>
              </div>
              <div className="quick-prompts-list">
                {sessionList.slice(0, 5).map(s => (
                  <button
                    key={s.id}
                    className={`quick-prompt-btn${currentSessionId === s.id ? ' active' : ''}`}
                    onClick={() => selectSession(s.id)}
                    style={{ textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  >
                    💬 {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Prompts */}
          <div>
            <div className="sidebar-section-title">Câu hỏi thường gặp</div>
            <div className="quick-prompts-list">
              {quickPrompts.map((p, i) => (
                <button key={i} className="quick-prompt-btn" onClick={() => sendMessage(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat */}
        <main className="chat-main">
          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome animate-fadeIn" style={{ maxWidth: 540, margin: '20px auto', textAlign: 'center' }}>
                <div className="chat-welcome-icon">{aiAvatar}</div>
                <div className="chat-welcome-title" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {car
                    ? `👋 Xin chào! Tôi là ${aiName} — thợ xe AI của ${car.brand} ${car.model} (${car.year}).`
                    : `Xin chào! Tôi là ${aiName}.`}
                </div>
                <div className="chat-welcome-desc" style={{ marginBottom: 24 }}>
                  {car
                    ? `Chiếc ${car.brand} ${car.model} của bạn chưa có lịch sử tư vấn dở dang. Hãy bắt đầu hỏi AI hoặc khai báo thêm thông tin xe bên dưới:`
                    : 'Hỏi tôi bất kỳ điều gì về xe của bạn. Bạn cũng có thể gửi ảnh hoá đơn, thu âm tiếng động lạ hoặc đính kèm video sự cố.'}
                </div>

                {/* Customized Prompt Chips for New Car Profile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, textAlign: 'left' }}>
                  {[
                    { label: '📝 Khai báo lịch sử bảo dưỡng', action: () => router.push('/garage') },
                    { label: '🔍 Lịch bảo dưỡng tiếp theo khi nào?', action: () => sendMessage(`Chiếc ${car?.brand || 'xe'} ${car?.model || ''} của tôi cần làm những hạng mục bảo dưỡng gì tiếp theo?`) },
                    { label: '📸 Gửi ảnh bill / hóa đơn sửa xe', action: () => document.getElementById('chat-file-upload')?.click() },
                    { label: '🎙️ Thu âm tiếng động lạ động cơ', action: () => startRecording() },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={chip.action}
                      className="card"
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-surface)',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'user' : ''} animate-fadeInUp`}>
                  <div className="message-avatar">
                    {msg.role === 'user' ? '😊' : aiAvatar}
                  </div>
                  <div className="message-bubble">
                    {/* Render Attachments in message */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                            {att.type === 'image' && (
                              <img src={att.url} alt={att.name} style={{ maxWidth: 220, maxHeight: 180, objectFit: 'cover', display: 'block' }} />
                            )}
                            {att.type === 'audio' && (
                              <audio controls src={att.url} style={{ height: 36, maxWidth: 240 }} />
                            )}
                            {att.type === 'video' && (
                              <video controls src={att.url} style={{ maxWidth: 240, maxHeight: 160 }} />
                            )}
                            {att.type === 'file' && (
                              <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--accent)' }}>
                                📄 {att.name}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      <div>{msg.content}</div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="message-row animate-fadeIn">
                <div className="message-avatar">{aiAvatar}</div>
                <div className="message-bubble" style={{ padding: 0 }}>
                  <div className="typing-indicator">
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile quick prompts */}
          <div className="mobile-quick-prompts">
            {quickPrompts.slice(0, 4).map((p, i) => (
              <button key={i} className="mobile-quick-prompt" onClick={() => sendMessage(p)}>
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="chat-input-area">
            {/* Attachment preview list */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--bg-surface)', borderTopLeftRadius: 12, borderTopRightRadius: 12, overflowX: 'auto' }}>
                {attachments.map((att, index) => (
                  <div key={index} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.78rem' }}>
                    {att.type === 'image' && <span>🖼️ {att.name}</span>}
                    {att.type === 'audio' && <span>🎙️ {att.name}</span>}
                    {att.type === 'video' && <span>🎥 {att.name}</span>}
                    {att.type === 'file' && <span>📄 {att.name}</span>}
                    <button
                      onClick={() => removeAttachment(index)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', marginLeft: 4, fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="chat-input-box">
              {/* Hidden file input with unique ID */}
              <input
                id="chat-file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Native Label Upload Button */}
              <label
                htmlFor="chat-file-upload"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  padding: '8px 6px',
                  color: 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 40,
                  minHeight: 44,
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                }}
                title="Tải ảnh, video hoặc file hóa đơn"
              >
                {isUploading ? '⏳' : '📎'}
              </label>

              {/* Live Voice Recorder Button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  background: isRecording ? 'rgba(239,68,68,0.2)' : 'none',
                  border: isRecording ? '1px solid #EF4444' : 'none',
                  borderRadius: 8,
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  color: isRecording ? '#EF4444' : 'var(--text-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 40,
                  minHeight: 44,
                  userSelect: 'none',
                  animation: isRecording ? 'pulse 1.2s infinite' : 'none',
                }}
                title={isRecording ? 'Bấm để dừng ghi âm tiếng máy nổ/tiếng rít' : 'Thu âm tiếng động lạ động cơ'}
              >
                {isRecording ? '🔴 Dừng' : '🎙️'}
              </button>


              <textarea
                ref={textareaRef}
                className="chat-textarea"
                placeholder={theme === 'pro'
                  ? 'Mô tả vấn đề xe, đính kèm ảnh bill sửa chữa, video hoặc ghi âm...'
                  : 'Hỏi gì cũng được nha! Gửi ảnh hoặc âm thanh cho mình xem nhé 😊'}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
              />

              <button
                className="chat-send-btn"
                onClick={() => sendMessage()}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                title="Gửi (Enter)"
              >
                ↑
              </button>
            </div>

            <div className="chat-input-hint">
              📎 Nhấn icon ghim để đính kèm Ảnh, Ghi âm, Video hoặc File hoá đơn · Enter để gửi
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="spinner" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

