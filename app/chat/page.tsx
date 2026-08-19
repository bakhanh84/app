'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AITheme, QUICK_PROMPTS_PRO, QUICK_PROMPTS_FRIENDLY } from '@/lib/gemini';
import { CarProfile } from '@/lib/maintenance';
import { getCarImageUrl } from '@/lib/car-images';
import { VoiceCallModal } from '@/app/components/VoiceCallModal';

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
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrFileRef] = useState(() => typeof document !== 'undefined' ? document.createElement('input') : null);
  const [car, setCar] = useState<CarProfile | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userApiKey, setUserApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);



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
    // Always use light theme for app
    document.documentElement.removeAttribute('data-theme');

    const savedKey = localStorage.getItem('sparkgo_user_gemini_key') || '';
    if (savedKey) setUserApiKey(savedKey);

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
          customApiKey: userApiKey || (typeof window !== 'undefined' ? localStorage.getItem('sparkgo_user_gemini_key') || undefined : undefined),
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

  const handleVoiceSendMessage = async (voiceText: string): Promise<string> => {
    if (!voiceText.trim()) return '';

    const userMsgId = Date.now().toString();
    const userMsg: Message = { role: 'user', content: voiceText, id: userMsgId };
    setMessages(prev => [...prev, userMsg]);

    const history = messages.concat(userMsg).map(m => ({
      role: m.role === 'user' ? 'user' : ('model' as const),
      parts: [{ text: m.content }],
    }));

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

    try {
      let activeSid = currentSessionId;
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
          message: voiceText,
          history,
          car,
          theme,
          sessionId: activeSid,
          customApiKey: userApiKey || (typeof window !== 'undefined' ? localStorage.getItem('sparkgo_user_gemini_key') || undefined : undefined),
        }),
      });

      if (!res.ok) {
        const errText = 'Có lỗi kết nối AI.';
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errText } : m));
        return errText;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const final = accumulated;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: final } : m));
      }

      return accumulated;
    } catch (err) {
      const errText = 'Có lỗi xảy ra khi truyền tin thoại.';
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: errText } : m));
      return errText;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const switchTheme = (t: AITheme) => {
    setTheme(t);
    localStorage.setItem('sparkgo_theme', t);
  };

  const quickPrompts = theme === 'pro' ? QUICK_PROMPTS_PRO : QUICK_PROMPTS_FRIENDLY;
  const aiName = theme === 'pro' ? 'Thầy Hùng' : 'Minh';
  const aiAvatar = theme === 'pro' ? '🔧' : '🤝';

  const handleOcrInChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      // Add to attachments for normal upload
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploaded = await uploadRes.json();
          setAttachments(prev => [...prev, uploaded]);
          setInput(prev => prev || 'Hãy đọc hóa đơn/biên lai này và tóm tắt các hạng mục sửa chữa, chi phí, và tư vấn xem có hợp lý không?');
        }
      } catch {}
      setOcrLoading(false);
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  return (
    <>
      {/* Chat Header — Light Theme */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* History drawer toggle (mobile) */}
          <button
            onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
            style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
            title="Lịch sử chat"
          >
            ☰
          </button>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, background: 'var(--orange)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#FFF' }}>⚡</div>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Spark<span style={{ color: 'var(--orange)' }}>Go</span></span>
          </Link>
          {car && (
            <div style={{ background: 'var(--orange-pale)', border: '1px solid var(--orange-border)', borderRadius: 99, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: 'var(--orange)' }}>
              🚗 {car.brand} {car.model}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* AI Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 99, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
            <button onClick={() => switchTheme('pro')} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: theme === 'pro' ? 'var(--orange)' : 'transparent', color: theme === 'pro' ? '#FFF' : 'var(--text-3)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>🔧 Pro</button>
            <button onClick={() => switchTheme('friendly')} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: theme === 'friendly' ? 'var(--orange)' : 'transparent', color: theme === 'friendly' ? '#FFF' : 'var(--text-3)', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>🤝 Thân</button>
          </div>

          <button
            onClick={() => setShowVoiceModal(true)}
            style={{ background: 'var(--orange)', color: '#FFF', fontWeight: 700, borderRadius: 10, border: 'none', padding: '7px 13px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', boxShadow: '0 2px 8px var(--orange-glow)' }}
          >
            📞 Gọi AI
          </button>

          {session?.user ? (
            <img src={session.user.image || ''} alt={session.user.name || 'U'} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--orange)', cursor: 'pointer' }} onClick={handleSignOut} title="Đăng xuất" />
          ) : (
            <Link href="/login" style={{ padding: '7px 14px', background: 'var(--orange)', color: '#FFF', borderRadius: 10, fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>Đăng nhập</Link>
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
              <div className="chat-welcome" style={{ maxWidth: 500, margin: '20px auto', textAlign: 'center' }}>
                <div className="chat-welcome-icon">{aiAvatar}</div>
                <div className="chat-welcome-title">
                  {car
                    ? `${aiName} — AI Thợ Xe`
                    : `Xin chào! Tôi là ${aiName}.`}
                </div>
                <div className="chat-welcome-desc">
                  {car
                    ? `Sẵn sàng tư vấn về ${car.brand} ${car.model} (${car.year}) — ${car.currentKm?.toLocaleString('vi-VN')} km. Hỏi gì cũng được!`
                    : 'Hỏi tôi bất kỳ điều gì về xe. Gửi ảnh hóa đơn, thu âm tiếng động lạ, hoặc mô tả sự cố.'}
                </div>
                {car && (
                  <div className="chat-car-pill">🚗 {car.brand} {car.model} · {car.currentKm?.toLocaleString('vi-VN')} km</div>
                )}

                {/* Quick action chips */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20, textAlign: 'left' }}>
                  {[
                    { label: '🔧 Bảo dưỡng sắp tới?', action: () => sendMessage(`Chiếc ${car?.brand || 'xe'} của tôi cần bảo dưỡng gì tiếp theo?`) },
                    { label: '📸 Đọc hóa đơn sửa xe', action: () => document.getElementById('chat-ocr-input')?.click() },
                    { label: '🎙️ Thu âm tiếng động lạ', action: () => startRecording() },
                    { label: '💰 Phân tích chi phí', action: () => sendMessage('Phân tích chi phí bảo dưỡng xe hợp lý là bao nhiêu?') },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={chip.action}
                      style={{
                        padding: '12px 14px',
                        cursor: 'pointer',
                        border: '1.5px solid var(--border)',
                        background: '#FFF',
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text-1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--orange)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
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
              {/* Hidden file inputs */}
              <input
                id="chat-file-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              {/* OCR / Receipt scan input */}
              <input
                id="chat-ocr-input"
                type="file"
                accept="image/*"
                onChange={handleOcrInChat}
                style={{ display: 'none' }}
              />

              {/* Upload / OCR toggle */}
              <div style={{ display: 'flex', gap: 4 }}>
                <label
                  htmlFor="chat-file-upload"
                  className="chat-action-btn"
                  title="Tải ảnh, video hoặc file"
                  style={{ display: 'flex', cursor: 'pointer' }}
                >
                  {isUploading ? '⏳' : '📎'}
                </label>
                <label
                  htmlFor="chat-ocr-input"
                  className="chat-action-btn"
                  title="Scan hóa đơn bảo dưỡng"
                  style={{ display: 'flex', cursor: 'pointer', fontSize: 15 }}
                >
                  {ocrLoading ? '⏳' : '🧾'}
                </label>
              </div>

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

      {/* Gemini API Key Configuration Modal */}
      {showKeyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div className="card animate-fadeInUp" style={{ maxWidth: 480, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                🔑 Cấu Hình Google Gemini API Key
              </h3>
              <button onClick={() => setShowKeyModal(false)} className="btn btn-ghost btn-sm" style={{ fontSize: 18 }}>✕</button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 16 }}>
              Dán API Key cá nhân của bạn từ Google AI Studio để trò chuyện trực tiếp với mô hình AI <strong>Gemini 2.0 Flash</strong> thời gian thực không giới hạn!
            </p>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Google Gemini API Key (bắt đầu bằng <code>AIzaSy...</code>)</label>
              <input
                type="password"
                className="form-input"
                placeholder="AIzaSy..."
                value={userApiKey}
                onChange={e => setUserApiKey(e.target.value)}
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', background: 'var(--bg-surface)', padding: 12, borderRadius: 8, marginBottom: 20 }}>
              💡 Chưa có Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)', fontWeight: 700 }}>Bấm vào đây để lấy Key miễn phí từ Google →</a>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              {userApiKey && (
                <button
                  type="button"
                  onClick={() => {
                    setUserApiKey('');
                    localStorage.removeItem('sparkgo_user_gemini_key');
                    setShowKeyModal(false);
                  }}
                  className="btn btn-outline"
                  style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  Xóa Key
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (userApiKey.trim()) {
                    localStorage.setItem('sparkgo_user_gemini_key', userApiKey.trim());
                  } else {
                    localStorage.removeItem('sparkgo_user_gemini_key');
                  }
                  setShowKeyModal(false);
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Lưu cấu hình Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Call AI Modal */}
      <VoiceCallModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        car={car}
        theme={theme}
        customApiKey={userApiKey}
        onSendMessage={async (voiceText: string) => {
          return await handleVoiceSendMessage(voiceText);
        }}
      />
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="sg-spinner" style={{ width: 32, height: 32 }} />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}

