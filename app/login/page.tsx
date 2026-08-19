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
      window.location.href = '/';
    }
  }, [status]);

  const handleGoogleSignIn = () => {
    setIsSigningIn(true);
    signIn('google', { callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="sg-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ animation: 'fadeInUp 0.4s ease both' }}>
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <div className="login-title">SparkGo</div>
          <div className="login-subtitle">AI Thợ Xe Thân Tín của bạn</div>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          {[
            { icon: '🧠', text: 'AI nhớ về chiếc xe của bạn theo thời gian' },
            { icon: '🔧', text: 'Tư vấn bảo dưỡng cá nhân hóa' },
            { icon: '📸', text: 'Đọc hóa đơn tự động qua AI' },
            { icon: '📜', text: 'Car Journal — nhật ký xe trọn đời' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 18 }}>{f.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="login-google-btn"
        >
          {isSigningIn ? (
            <div className="sg-spinner" />
          ) : (
            <svg className="login-google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isSigningIn ? 'Đang đăng nhập...' : 'Tiếp tục với Google'}
        </button>

        <p className="login-privacy">
          Bằng cách đăng nhập, bạn đồng ý với{' '}
          <a href="#" style={{ color: 'var(--orange)', fontWeight: 700 }}>Điều khoản sử dụng</a>
          {' '}và{' '}
          <a href="#" style={{ color: 'var(--orange)', fontWeight: 700 }}>Chính sách bảo mật</a>
          {' '}của SparkGo. Dữ liệu xe của bạn chỉ dùng để cải thiện tư vấn AI.
        </p>

        {/* Skip Login */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', fontWeight: 600 }}>
            Tiếp tục không đăng nhập →
          </Link>
        </div>
      </div>
    </div>
  );
}
