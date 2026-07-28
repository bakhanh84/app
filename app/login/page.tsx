'use client';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      // Sync local car profile to database upon login
      const localCar = localStorage.getItem('sparkgo_car');
      if (localCar) {
        try {
          const carData = JSON.parse(localCar);
          fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData),
          }).catch(() => {});
        } catch {}
      }
      window.location.href = '/chat';
    }
  }, [status]);


  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    signIn('google', { callbackUrl: '/chat' });
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0d192e 0%, #080c18 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(47,128,255,0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
      }} />

      {/* Main Container */}
      <div className="animate-fadeInUp" style={{
        width: '100%',
        maxWidth: '440px',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #2F80FF 0%, #0052CC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 8px 24px rgba(47,128,255,0.4)',
            }}>
              ⚡
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                Spark<span style={{ color: '#2F80FF' }}>Go</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 4 }}>
                Nền tảng Chăm sóc Ô tô AI
              </div>
            </div>
          </Link>
        </div>

        {/* Card Box */}
        <div style={{
          background: 'rgba(20, 30, 48, 0.75)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24,
          padding: '36px 28px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F0F4FF', marginBottom: 8, letterSpacing: '-0.02em' }}>
              Đăng nhập tài khoản
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.5 }}>
              Lưu hồ sơ xe điện tử, đồng bộ lịch sử bảo dưỡng và nội dung trao đổi với AI thợ xe.
            </p>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              background: '#FFFFFF',
              color: '#1E293B',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, boxShadow 0.15s ease',
              marginBottom: 24,
            }}
            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isSigningIn ? 'Đang kết nối Google...' : 'Đăng nhập với Google'}
          </button>

          {/* Value Propositions */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {[
              { icon: '🚗', title: 'Hồ sơ xe điện tử', desc: 'Tự động tính km bảo dưỡng & ghi chép lịch sử' },
              { icon: '💬', title: 'Lưu trữ hội thoại 24/7', desc: 'Xem lại tư vấn thợ xe AI bất kỳ lúc nào' },
              { icon: '📱', title: 'Đồng bộ đa thiết bị', desc: 'Mở trên máy tính hay điện thoại đều giữ nguyên' },
              { icon: '🔒', title: 'Bảo mật dữ liệu', desc: 'Cam kết không bán hoặc chia sẻ dữ liệu cá nhân' },
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  fontSize: 18,
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(47,128,255,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#F0F4FF' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.4 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skip Link */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/chat" style={{ color: '#94A3B8', fontSize: '0.85rem', textDecoration: 'none' }}>
            Trải nghiệm thử không đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
