'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/',           icon: '🏠', label: 'Home' },
    { href: '/garage',     icon: '🚗', label: 'Xe Tôi' },
    { href: '/chat',       icon: '💬', label: 'AI',     isCenter: true },
    { href: '/calendar',   icon: '🔧', label: 'Bảo Dưỡng' },
    { href: '/history',    icon: '📜', label: 'Lịch Sử' },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(item => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        if (item.isCenter) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item ai-center${isActive ? ' active' : ''}`}
            >
              <div className="mobile-nav-icon-wrap">
                <span style={{ fontSize: 22 }}>💬</span>
              </div>
              <span>{item.label}</span>
            </Link>
          );
        }

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
