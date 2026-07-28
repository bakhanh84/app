'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: '🏠', label: 'Trang chủ' },
    { href: '/chat', icon: '💬', label: 'Chat AI' },
    { href: '/calendar', icon: '📅', label: 'Bảo dưỡng' },
    { href: '/history', icon: '📜', label: 'Lịch sử' },
    { href: '/login', icon: '👤', label: 'Tài khoản' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(item => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
