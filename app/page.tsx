'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getCarImageUrl, getCarHealthStatus } from '@/lib/car-images';

export default function LandingPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<'pro' | 'friendly'>('pro');
  const [userCars, setUserCars] = useState<any[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

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


  useEffect(() => {
    const saved = localStorage.getItem('sparkgo_theme') as 'pro' | 'friendly' | null;
    if (saved) setTheme(saved);

    if (session?.user) {
      setLoadingCars(true);
      fetch('/api/cars')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setUserCars(data);
          setLoadingCars(false);
        })
        .catch(() => setLoadingCars(false));
    }
  }, [session]);

  const switchTheme = (t: 'pro' | 'friendly') => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('sparkgo_theme', t);
  };

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="navbar-logo-icon">⚡</div>
          Spark<span>Go</span>
        </div>
        <div className="navbar-actions">
          <div className="theme-toggle">
            <button
              className={`theme-toggle-btn${theme === 'pro' ? ' active' : ''}`}
              onClick={() => switchTheme('pro')}
            >
              🔧 Pro
            </button>
            <button
              className={`theme-toggle-btn${theme === 'friendly' ? ' active' : ''}`}
              onClick={() => switchTheme('friendly')}
            >
              🤝 Friendly
            </button>
          </div>

          {session?.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/garage" className="btn btn-outline btn-sm">
                🚘 Gara Xe
              </Link>
              <Link href="/chat" className="btn btn-primary btn-sm">
                💬 Vào Chat AI
              </Link>
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || ''} style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <button onClick={handleSignOut} className="btn btn-outline btn-sm">
                🚪 Thoát
              </button>
            </div>
          ) : (

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link href="/login" className="btn btn-outline btn-sm">
                🔑 Đăng nhập / Đăng ký
              </Link>
              <Link href="/chat" className="btn btn-primary btn-sm">
                🚀 Dùng thử ngay
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Logged-In User Fleet Showcase Section */}
      {session?.user && userCars.length > 0 && (
        <section style={{ paddingTop: 'calc(var(--nav-height) + 24px)', paddingBottom: 12, maxWidth: 1100, margin: '0 auto', paddingLeft: 20, paddingRight: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                XIN CHÀO {session.user.name?.toUpperCase() || 'CHỦ XE'}!
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-1)' }}>
                🚘 Đội Xe Của Tôi ({userCars.length}/5 xe)
              </h2>
            </div>

            {userCars.length < 5 && (
              <Link href="/onboarding" className="btn btn-outline btn-sm">
                + Thêm xe mới ({userCars.length}/5)
              </Link>
            )}
          </div>

          {/* Fleet Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 20 }}>
            {userCars.map(car => {
              const imgUrl = getCarImageUrl(car.brand, car.model);
              const health = getCarHealthStatus(car.currentKm, car.lastOilChangeKm, car.lastOilChangeDate);

              return (
                <div key={car.id} className="card animate-fadeInUp" style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: `1px solid ${health.borderColor}`,
                  background: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Car Image Visual & Status Overlay */}
                  <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                    <img src={imgUrl} alt={car.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      background: health.bgColor,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${health.borderColor}`,
                      color: health.color,
                      padding: '4px 10px',
                      borderRadius: 100,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <span>{health.icon}</span>
                      <span>{health.label}</span>
                    </div>

                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',

                      padding: '16px 16px 8px',
                    }}>
                      <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#FFFFFF' }}>
                        {car.brand} {car.model}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#CBD5E1' }}>
                        Năm {car.year} {car.licensePlate ? `· Biển ${car.licensePlate}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 10 }}>
                        <span style={{ color: 'var(--text-3)' }}>Số km hiện tại:</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent-light)' }}>
                          {(car.currentKm || 0).toLocaleString('vi-VN')} km
                        </span>
                      </div>

                      {/* Issue Pills */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        {health.issues.map((iss, i) => (
                          <div key={i} style={{ fontSize: '0.78rem', color: health.color, background: health.bgColor, padding: '4px 8px', borderRadius: 6 }}>
                            {iss}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/chat?carId=${car.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                        💬 Chat AI xe này
                      </Link>
                      <Link href="/garage" className="btn btn-outline btn-sm">
                        📁 Gara
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="animate-fadeInUp">
            <div className="hero-badge">
              <span>✨</span>
              <span>AI Thợ Xe — Không vụ lợi, 24/7</span>
            </div>
            <h1 className="hero-title">
              Người thợ xe<br />
              <span className="accent">thân tín</span> của bạn<br />
              — luôn online
            </h1>
            <p className="hero-desc">
              Nạp thông tin chiếc xe của bạn và hỏi han mọi thứ — từ bảo dưỡng, 
              chẩn đoán sự cố, đến giá cả thị trường. Như người thợ quen lâu năm, 
              không bao giờ vụ lợi.
            </p>

            <div className="hero-actions">
              {session?.user ? (
                <Link href="/chat" className="btn btn-primary btn-lg">
                  💬 Vào Phòng Chat AI Thợ Xe →
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn btn-primary btn-lg">
                    🔑 Đăng ký / Đăng nhập ngay
                  </Link>
                  <Link href="/chat" className="btn btn-ghost btn-lg">
                    🚀 Trải nghiệm thử không cần tài khoản →
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">5M+</div>
                <div className="hero-stat-label">Xe ô tô tại Việt Nam</div>
              </div>
              <div>
                <div className="hero-stat-value">0đ</div>
                <div className="hero-stat-label">Chi phí tư vấn</div>
              </div>
              <div>
                <div className="hero-stat-value">24/7</div>
                <div className="hero-stat-label">Luôn sẵn sàng</div>
              </div>
            </div>
          </div>

          {/* Mock Chat Preview */}
          <div className="hero-visual animate-fadeInUp delay-2">
            <div className="mock-phone">
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔧</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                    {theme === 'pro' ? 'Thầy Hùng' : 'Minh'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>● Đang online</div>
                </div>
              </div>
              <div className="mock-chat">
                <div className="mock-msg user" style={{ animationDelay: '0.3s' }}>
                  <div className="mock-avatar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>😊</div>
                  <div className="mock-bubble">
                    Xe tôi chạy 45,000km, chưa thay dầu từ 40,000km. Có cần vội không?
                  </div>
                </div>
                <div className="mock-msg" style={{ animationDelay: '0.8s' }}>
                  <div className="mock-avatar">🔧</div>
                  <div className="mock-bubble">
                    {theme === 'pro'
                      ? '[CẦN LÀM SỚM] Đã 5,000km chưa thay — đúng chu kỳ rồi. Để thêm là dầu xuống cấp, tăng ma sát. Ưu tiên xử lý trong tuần này.'
                      : '⚠️ Cần thay sớm rồi nha! 5,000km là đúng chu kỳ rồi đó. Dầu cũ làm xe hao xăng hơn đấy. Ghé garage trong 1-2 ngày tới là ổn 😊'}
                  </div>
                </div>
                <div className="mock-msg user" style={{ animationDelay: '1.5s' }}>
                  <div className="mock-avatar" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>😊</div>
                  <div className="mock-bubble">
                    Dầu nào phù hợp? Garage bảo tôi dùng loại 500k/lít...
                  </div>
                </div>
                <div className="mock-msg" style={{ animationDelay: '2.2s' }}>
                  <div className="mock-avatar">🔧</div>
                  <div className="mock-bubble">
                    {theme === 'pro'
                      ? 'Nghe giá đó hơi cao. Toyota Vios chỉ cần 5W-30 hay 0W-20 xịn. Giá thị trường ~250-350k/lít là đủ tốt.'
                      : 'Ồ giá đó hơi cao đó! Xe mình dùng 5W-30 là OK. Tầm 250-350k/lít là chất lượng tốt rồi nha, tiết kiệm được ở đây 💰'}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div style={{
              position: 'absolute', bottom: -16, right: -8,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '10px 16px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: '0.82rem', color: 'var(--text-1)',
            }}>
              <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
              Không bao giờ vụ lợi
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div>
          <div className="section-label">TẠI SAO CHỌN SPARKGO</div>
          <h2 className="section-title">Mọi thứ bạn cần<br />cho chiếc xe</h2>
          <p className="section-desc">
            Từ hồ sơ xe thông minh, đến AI tư vấn 24/7 và lịch bảo dưỡng tự động — 
            tất cả trong một nơi, hoàn toàn miễn phí.
          </p>
        </div>
        <div className="features-grid">
          {[
            {
              icon: '📁',
              title: 'Hồ Sơ Xe Thông Minh',
              desc: 'Lưu toàn bộ thông tin xe, lịch sử bảo dưỡng. AI học từ dữ liệu để cho lời khuyên chính xác hơn theo thời gian.',
            },
            {
              icon: '🤖',
              title: 'AI Thợ Xe 24/7',
              desc: 'Hỏi bất kỳ điều gì về xe — triệu chứng lạ, lịch bảo dưỡng, giá phụ tùng. AI hiểu xe cụ thể của bạn, không phải câu trả lời chung chung.',
            },
            {
              icon: '📅',
              title: 'Lịch Bảo Dưỡng Tự Động',
              desc: 'Không bao giờ quên lịch thay dầu, kiểm tra phanh, hay đăng kiểm. Nhắc nhở thông minh theo km và điều kiện thực tế tại Việt Nam.',
            },
            {
              icon: '💰',
              title: 'Biết Giá Trước Khi Đi Sửa',
              desc: 'Hỏi AI về mức giá thị trường trước khi vào garage. Không bị chặt chém, biết đủ thông tin để thương lượng.',
            },
            {
              icon: '🔍',
              title: 'Chẩn Đoán Triệu Chứng',
              desc: 'Mô tả tiếng kêu lạ, đèn báo, hay bất kỳ sự cố nào. AI phân tích mức độ nghiêm trọng và hướng dẫn xử lý.',
            },
            {
              icon: '🛡️',
              title: 'Không Vụ Lợi — Cam Kết',
              desc: 'AI của SparkGo không bao giờ nhận hoa hồng, không push bán hàng. Chỉ một mục tiêu: bảo vệ lợi ích của chủ xe.',
            },
          ].map((f, i) => (
            <div key={i} className={`feature-card animate-fadeInUp delay-${(i % 4) + 1}`}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" style={{ marginBottom: 80 }}>
        <div className="cta-box">
          <h2 className="cta-box-title">Sẵn sàng gặp thợ xe AI của bạn?</h2>
          <p className="cta-box-desc">
            Đăng ký tài khoản miễn phí chỉ trong 5 giây với Google.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/login" className="btn btn-primary btn-lg">
              🔑 Đăng ký / Đăng nhập với Google
            </Link>
            <Link href="/chat" className="btn btn-ghost btn-lg">
              🚀 Trải nghiệm AI ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-3)', fontSize: '0.82rem' }}>
        © 2026 SparkGo — Nền tảng Chăm sóc Ô tô AI Thân Tín
      </footer>
    </>
  );
}
