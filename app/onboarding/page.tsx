'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CAR_BRANDS, AITheme } from '@/lib/gemini';
import { CarProfile } from '@/lib/maintenance';
import { getCarImageUrl } from '@/lib/car-images';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [theme, setTheme] = useState<AITheme>('pro');
  const [car, setCar] = useState<Partial<CarProfile>>({
    brand: '',
    model: '',
    year: new Date().getFullYear() - 2,
    currentKm: 30000,
    fuelType: 'petrol',
    transmission: 'auto',
    color: '',
    lastOilChangeKm: undefined,
    lastOilChangeDate: '',
    notes: '',
  });
  const [models, setModels] = useState<string[]>([]);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('sparkgo_theme') as AITheme | null;
    if (saved) setTheme(saved);
  }, []);

  // Update available models when brand changes
  useEffect(() => {
    if (car.brand && CAR_BRANDS[car.brand]) {
      setModels(CAR_BRANDS[car.brand]);
    } else {
      setModels([]);
    }
  }, [car.brand]);

  const selectTheme = (t: AITheme) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('sparkgo_theme', t);
  };

  const updateCar = (field: keyof CarProfile, value: string | number) => {
    setCar(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as Step);
    else handleFinish();
  };

  const handleFinish = async () => {
    const fullCar: CarProfile = {
      brand: car.brand || 'Không rõ',
      model: car.model || 'Không rõ',
      year: car.year || new Date().getFullYear(),
      currentKm: car.currentKm || 0,
      fuelType: car.fuelType || 'petrol',
      transmission: car.transmission || 'auto',
      color: car.color,
      lastOilChangeKm: car.lastOilChangeKm,
      lastOilChangeDate: car.lastOilChangeDate,
      notes: car.notes,
    };
    localStorage.setItem('sparkgo_car', JSON.stringify(fullCar));

    try {
      await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullCar),
      });
    } catch {}

    router.push('/chat');
  };


  const canProceedStep2 = car.brand && car.model && car.year && car.currentKm;

  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
  const fuelTypes = [
    { value: 'petrol', label: '⛽ Xăng' },
    { value: 'diesel', label: '🛢️ Dầu diesel' },
    { value: 'hybrid', label: '🔋 Hybrid' },
    { value: 'electric', label: '⚡ Điện' },
  ];

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-logo">
          <div className="navbar-logo-icon">⚡</div>
          Spark<span>Go</span>
        </div>
      </nav>

      <div className="onboarding-page">
        <div className="onboarding-container">
          {/* Steps */}
          <div className="steps-indicator">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}
              />
            ))}
          </div>

          {/* Step 1: Choose Theme */}
          {step === 1 && (
            <div className="animate-fadeInUp">
              <div className="onboarding-header">
                <h1 className="onboarding-step-title">Chọn phong cách AI</h1>
                <p className="onboarding-step-desc">
                  Bạn muốn AI thợ xe nói chuyện với bạn như thế nào?
                </p>
              </div>

              <div className="theme-picker">
                {/* PRO Card */}
                <div
                  className={`theme-card theme-card-pro ${theme === 'pro' ? 'selected' : ''}`}
                  onClick={() => selectTheme('pro')}
                >
                  <div className="theme-card-preview">
                    <div className="mini-bubble" style={{ width: '65%' }} />
                    <div className="mini-bubble-sm" style={{ width: '40%' }} />
                  </div>
                  <div className="theme-card-name">🔧 Pro</div>
                  <div className="theme-card-desc">
                    Thợ kỳ cựu 20 năm. Thẳng thắn, chuyên nghiệp, đúng thuật ngữ. 
                    Giải thích kỹ càng.
                  </div>
                </div>

                {/* FRIENDLY Card */}
                <div
                  className={`theme-card theme-card-friendly ${theme === 'friendly' ? 'selected' : ''}`}
                  onClick={() => selectTheme('friendly')}
                >
                  <div className="theme-card-preview">
                    <div className="mini-bubble" style={{ width: '70%' }} />
                    <div className="mini-bubble-sm" style={{ width: '45%' }} />
                  </div>
                  <div className="theme-card-name">🤝 Friendly</div>
                  <div className="theme-card-desc">
                    Bạn thân am hiểu xe. Thân thiện, dễ hiểu, dùng emoji. 
                    Không dùng thuật ngữ phức tạp.
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card" style={{ marginTop: 16, marginBottom: 24 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ví dụ câu trả lời:</div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {theme === 'pro' ? '🔧' : '🤝'}
                  </div>
                  <div style={{ background: 'var(--ai-bubble-bg)', color: 'var(--ai-bubble-text)', padding: '10px 14px', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    {theme === 'pro'
                      ? '[CẦN LÀM SỚM] Ắc-quy của xe đã 3 năm. Dấu hiệu cần thay: máy đề chậm buổi sáng, đèn yếu hơn. Kiểm tra điện áp trong tuần này.'
                      : '⚠️ Ắc-quy xe được 3 năm rồi nha! Thường là 3-5 năm nên thay. Nếu thấy xe đề hơi chậm buổi sáng lạnh thì nên đi kiểm tra sớm thôi 😊'}
                  </div>
                </div>
              </div>

              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNext}>
                Tiếp tục — Thêm thông tin xe →
              </button>
            </div>
          )}

          {/* Step 2: Car Info */}
          {step === 2 && (
            <div className="animate-fadeInUp">
              <div className="onboarding-header">
                <h1 className="onboarding-step-title">Thông tin xe của bạn</h1>
                <p className="onboarding-step-desc">
                  Càng chi tiết, AI càng tư vấn chính xác cho xe của bạn.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Hãng xe *</label>
                    <select
                      className="form-select"
                      value={car.brand}
                      onChange={e => { updateCar('brand', e.target.value); updateCar('model', ''); }}
                    >
                      <option value="">-- Chọn hãng --</option>
                      {Object.keys(CAR_BRANDS).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dòng xe *</label>
                    {models.length > 0 ? (
                      <select
                        className="form-select"
                        value={car.model}
                        onChange={e => updateCar('model', e.target.value)}
                      >
                        <option value="">-- Chọn dòng xe --</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                        <option value="Khác">Khác...</option>
                      </select>
                    ) : (
                      <input
                        className="form-input"
                        placeholder="Ví dụ: Camry, CX-5..."
                        value={car.model}
                        onChange={e => updateCar('model', e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Năm sản xuất *</label>
                    <select
                      className="form-select"
                      value={car.year}
                      onChange={e => updateCar('year', parseInt(e.target.value))}
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Số km hiện tại *</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Ví dụ: 45000"
                      value={car.currentKm || ''}
                      onChange={e => updateCar('currentKm', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Nhiên liệu *</label>
                    <select
                      className="form-select"
                      value={car.fuelType}
                      onChange={e => updateCar('fuelType', e.target.value)}
                    >
                      {fuelTypes.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hộp số *</label>
                    <select
                      className="form-select"
                      value={car.transmission}
                      onChange={e => updateCar('transmission', e.target.value)}
                    >
                      <option value="auto">🔄 Tự động</option>
                      <option value="manual">⚙️ Số sàn</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Màu xe (tuỳ chọn)</label>
                  <input
                    className="form-input"
                    placeholder="Ví dụ: Trắng ngọc trai, Đen, Bạc..."
                    value={car.color || ''}
                    onChange={e => updateCar('color', e.target.value)}
                  />
                </div>

                {/* Live Car Image Preview */}
                {car.brand && car.model && (
                  <div style={{
                    marginTop: 16,
                    padding: 16,
                    borderRadius: 14,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                      📸 HÌNH ẢNH DIỆN MẠO XE THỰC TẾ (AUTO MATCH)
                    </div>
                    <div style={{
                      height: 150,
                      borderRadius: 10,
                      backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%), url('${getCarImageUrl(car.brand, car.model, car.year)}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: 14,
                    }}>
                      <div style={{ color: '#fff' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                          {car.brand} {car.model} ({car.year})
                        </div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                          Phiên bản chuẩn theo năm sản xuất {car.year}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Quay lại</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                >
                  Tiếp tục →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Maintenance History */}
          {step === 3 && (
            <div className="animate-fadeInUp">
              <div className="onboarding-header">
                <h1 className="onboarding-step-title">Lịch sử bảo dưỡng</h1>
                <p className="onboarding-step-desc">
                  Tuỳ chọn — nhưng giúp AI tính lịch chính xác hơn. Bỏ qua nếu không có.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Car summary */}
                <div className="card" style={{ background: 'var(--accent-muted)', borderColor: 'var(--accent-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 72,
                    height: 52,
                    borderRadius: 8,
                    backgroundImage: `url('${getCarImageUrl(car.brand || '', car.model || '', car.year)}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-1)' }}>
                      {car.brand} {car.model} ({car.year})
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginTop: 2 }}>
                      {(car.currentKm || 0).toLocaleString('vi-VN')} km · {car.fuelType === 'petrol' ? 'Xăng' : car.fuelType === 'diesel' ? 'Diesel' : car.fuelType === 'hybrid' ? 'Hybrid' : 'Điện'} · {car.transmission === 'auto' ? 'Tự động' : 'Số sàn'}
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Km lần thay dầu cuối</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder="Ví dụ: 40000"
                      value={car.lastOilChangeKm || ''}
                      onChange={e => updateCar('lastOilChangeKm', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày thay dầu cuối</label>
                    <input
                      className="form-input"
                      type="date"
                      value={car.lastOilChangeDate || ''}
                      onChange={e => updateCar('lastOilChangeDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Ghi chú thêm về xe</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Ví dụ: Hay bị rung khi tốc độ cao, đèn Check Engine sáng 1 lần hồi tháng 3..."
                    value={car.notes || ''}
                    onChange={e => updateCar('notes', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" onClick={() => setStep(2)}>← Quay lại</button>
                <button className="btn btn-ghost" onClick={handleFinish}>
                  Bỏ qua
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleFinish}>
                  🚀 Gặp AI thợ xe ngay!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
