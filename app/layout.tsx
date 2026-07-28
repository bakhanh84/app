import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SparkGo — AI Thợ Xe Thân Tín',
  description:
    'Người thợ xe của riêng bạn — luôn online, không bao giờ vụ lợi. Tư vấn bảo dưỡng, chẩn đoán sự cố, và theo dõi sức khỏe xe ô tô.',
  keywords: 'bảo dưỡng xe, thợ xe AI, chăm sóc ô tô, tư vấn xe, SparkGo',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

import { Providers } from './providers';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" data-theme="pro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('sparkgo_theme') || 'pro';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}


