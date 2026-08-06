'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getCarImageUrl } from '@/lib/car-images';

// Sample fallback cars matching the screenshot design
const DEFAULT_CARS = [
  {
    id: 'car-bmw',
    brand: 'BMW',
    model: '3 Series',
    year: 2014,
    licensePlate: '51F-xxxx',
    currentKm: 86000,
    lastMaintenanceKm: 5200,
    healthScore: 'Rất tốt',
    statusText: 'Tình trạng: Tốt',
    certText: 'Đạt chuẩn 100%',
    image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'car-mazda',
    brand: 'Mazda',
    model: 'CX-5',
    year: 2020,
    licensePlate: '30H-888.88',
    currentKm: 42000,
    lastMaintenanceKm: 3100,
    healthScore: 'Tốt',
    statusText: 'Tình trạng: Tốt',
    certText: 'Đạt chuẩn 98%',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'car-vinfast',
    brand: 'VinFast',
    model: 'VF8',
    year: 2023,
    licensePlate: '51K-999.99',
    currentKm: 15000,
    lastMaintenanceKm: 1000,
    healthScore: 'Hoàn hảo',
    statusText: 'Tình trạng: Mới',
    certText: 'Đạt chuẩn 100%',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
  },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [userCars, setUserCars] = useState<any[]>([]);
  const [activeCarIndex, setActiveCarIndex] = useState(0);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/cars')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((c: any, index: number) => ({
              id: c.id,
              brand: c.brand || 'Xe',
              model: c.model || 'Ô tô',
              year: c.year || 2020,
              licensePlate: c.licensePlate || '51X-xxxx',
              currentKm: c.currentKm || 86000,
              lastMaintenanceKm: 5200,
              healthScore: 'Rất tốt',
              statusText: 'Tình trạng: Tốt',
              certText: 'Đạt chuẩn 100%',
              image: getCarImageUrl(c.brand, c.model, c.year) || DEFAULT_CARS[index % DEFAULT_CARS.length].image,
            }));
            setUserCars(mapped);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const cars = userCars.length > 0 ? userCars : DEFAULT_CARS;
  const currentCar = cars[activeCarIndex] || cars[0];

  const handleNextCar = () => {
    setActiveCarIndex((prev) => (prev + 1) % cars.length);
  };

  const handlePrevCar = () => {
    setActiveCarIndex((prev) => (prev - 1 + cars.length) % cars.length);
  };

  const userName = session?.user?.name || 'Khánh Nguyen';

  return (
    <div className="sparkgo-app-layout">
      {/* Top App Header */}
      <header className="sg-app-header">
        <Link href="/" className="sg-brand">
          <div className="sg-logo-box">⚡</div>
          <span className="sg-brand-name">
            Spark<span>Go</span>
          </span>
          <span className="sg-pro-tag">Pro</span>
        </Link>

        <div className="sg-header-actions">
          <button className="sg-icon-button" aria-label="Thông báo" style={{ cursor: 'default' }}>
            <span>🔔</span>
            <span className="sg-badge-dot"></span>
          </button>
          <Link href="/garage" className="sg-gara-top-btn">
            <span>🚘</span>
            <span>Gara xe</span>
          </Link>
        </div>
      </header>

      {/* User Greeting Section */}
      <div className="sg-greeting-header">
        <div>
          <h1 className="sg-greeting-title">👋 Xin chào, {userName}!</h1>
          <div className="sg-greeting-sub">
            <span>🤖</span>
            <span>AI Thợ Xe của bạn luôn sẵn sàng 24/7</span>
          </div>
        </div>
        <div className="sg-avatar-wrapper">
          <img
            src={
              session?.user?.image ||
              'https://api.iconify.design/fluent-emoji:robot.svg'
            }
            alt={userName}
            className="sg-avatar-img"
          />
        </div>
      </div>

      {/* Car Showcase Carousel Slider */}
      <section className="sg-carousel-section">
        <div className="sg-carousel-wrapper">
          <button className="sg-carousel-arrow left" onClick={handlePrevCar} aria-label="Xe trước">
            ‹
          </button>

          <div
            className="sg-car-card"
            style={{ backgroundImage: `url('${currentCar.image}')` }}
          >
            <div className="sg-car-card-overlay">
              <div className="sg-car-card-top">
                <span className="sg-car-index-tag">
                  {activeCarIndex + 1}/{cars.length}
                </span>
                <button className="sg-car-more-btn" style={{ cursor: 'default' }}>
                  •••
                </button>
              </div>

              <div className="sg-car-card-bottom">
                <h2 className="sg-car-name">
                  {currentCar.brand} {currentCar.model}
                </h2>
                <div className="sg-car-details">
                  Năm {currentCar.year} • Biển số {currentCar.licensePlate}
                </div>

                <div className="sg-car-status-bar">
                  <div className="sg-status-good">
                    <span className="sg-status-dot"></span>
                    <span>{currentCar.statusText}</span>
                  </div>
                  <span className="sg-status-cert">{currentCar.certText} ›</span>
                </div>
              </div>
            </div>
          </div>

          <button className="sg-carousel-arrow right" onClick={handleNextCar} aria-label="Xe kế tiếp">
            ›
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        <div className="sg-pagination-dots">
          {cars.map((_, idx) => (
            <span
              key={idx}
              className={`sg-dot ${idx === activeCarIndex ? 'active' : ''}`}
              onClick={() => setActiveCarIndex(idx)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>
      </section>

      {/* 3 Metric Cards Grid */}
      <div className="sg-metrics-grid">
        <div className="sg-metric-card">
          <div className="sg-metric-label">SỐ KM HIỆN TẠI</div>
          <div className="sg-metric-value">
            {currentCar.currentKm.toLocaleString('vi-VN')} km
          </div>
          <div className="sg-metric-icon-box">🧭</div>
        </div>

        <div className="sg-metric-card">
          <div className="sg-metric-label">LẦN BẢO DƯỠNG GẦN NHẤT</div>
          <div className="sg-metric-value">
            {currentCar.lastMaintenanceKm.toLocaleString('vi-VN')} km trước
          </div>
          <div className="sg-metric-icon-box">📅</div>
        </div>

        <div className="sg-metric-card">
          <div className="sg-metric-label">AI ĐÁNH GIÁ</div>
          <div className="sg-metric-value good-green">
            {currentCar.healthScore} <span style={{ color: '#10B981', fontSize: '14px' }}>✔</span>
          </div>
          <Link href="/garage" className="sg-metric-link">
            Xem chi tiết ›
          </Link>
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="sg-action-row">
        <Link href="/chat" className="sg-btn-main-orange">
          <span>💬</span>
          <span>Chat với AI Thợ Xe</span>
        </Link>
        <Link href="/garage" className="sg-btn-secondary-white">
          <span>🚘</span>
          <span>Vào Gara</span>
        </Link>
      </div>

      {/* Quick Actions (Thao tác nhanh) */}
      <section>
        <div className="sg-section-header">
          <h3 className="sg-section-title">Thao tác nhanh</h3>
          <span className="sg-section-link" style={{ color: '#FF5500', cursor: 'default' }}>
            Tùy chỉnh ⚙️
          </span>
        </div>

        <div className="sg-quick-grid">
          <Link href="/onboarding" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#FFF0EB', color: '#FF5500' }}>
              ➕
            </div>
            <span className="sg-quick-label">Thêm xe</span>
          </Link>

          {/* Non-clickable button */}
          <div className="sg-quick-item disabled">
            <div className="sg-quick-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
              📄
            </div>
            <span className="sg-quick-label">Thêm hóa đơn</span>
          </div>

          <Link href="/calendar" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#FFF0EB', color: '#FF5500' }}>
              📅
            </div>
            <span className="sg-quick-label">Lịch bảo dưỡng</span>
          </Link>

          <Link href="/chat?prompt=chandoan" className="sg-quick-item">
            <div className="sg-quick-icon" style={{ background: '#FFF5F0', color: '#F59E0B' }}>
              🛠️
            </div>
            <span className="sg-quick-label">Sự cố & sửa chữa</span>
          </Link>

          {/* Non-clickable button */}
          <div className="sg-quick-item disabled">
            <div className="sg-quick-icon" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
              📈
            </div>
            <span className="sg-quick-label">Báo cáo xe</span>
          </div>
        </div>
      </section>

      {/* Upcoming Maintenance Section (Sắp đến hạn bảo dưỡng) */}
      <section style={{ marginTop: '14px' }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">Sắp đến hạn bảo dưỡng</h3>
          <Link href="/calendar" className="sg-section-link">
            Xem tất cả ›
          </Link>
        </div>

        <div className="sg-card-container">
          <div className="sg-maint-card">
            <div className="sg-maint-icon">🛢️</div>
            <div className="sg-maint-info">
              <div className="sg-maint-title">Thay dầu động cơ</div>
              <div className="sg-maint-sub">Dự kiến sau 1.800 km hoặc 20 ngày nữa</div>
              <div className="sg-maint-progress-bg">
                <div className="sg-maint-progress-fill" style={{ width: '82%' }}></div>
              </div>
              <div className="sg-maint-km">8.200 / 10.000 km</div>
            </div>
            <Link href="/calendar" className="sg-maint-btn">
              Chi tiết
            </Link>
          </div>
        </div>
      </section>

      {/* AI Recommendations Card (AI Thợ Xe gợi ý cho bạn) */}
      <section style={{ marginTop: '4px' }}>
        <div className="sg-section-header">
          <h3 className="sg-section-title">AI Thợ Xe gợi ý cho bạn</h3>
          <Link href="/chat" className="sg-section-link">
            Xem thêm ›
          </Link>
        </div>

        <div className="sg-card-container">
          <Link href="/chat" className="sg-recom-card" style={{ textDecoration: 'none' }}>
            <div className="sg-recom-icon">🛡️</div>
            <div className="sg-recom-info">
              <div className="sg-recom-title">Kiểm tra ắc quy</div>
              <div className="sg-recom-sub">
                Ắc quy của bạn đã sử dụng 3 năm 8 tháng. Nên kiểm tra để tránh sự cố bất ngờ.
              </div>
            </div>
            <div className="sg-recom-arrow">›</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
