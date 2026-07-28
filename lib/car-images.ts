export interface CarHealthBadge {
  status: 'green' | 'yellow' | 'red';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  issues: string[];
}

export function getCarImageUrl(brand: string, model: string): string {
  const b = (brand || '').toLowerCase();
  const m = (model || '').toLowerCase();

  if (b.includes('toyota')) {
    if (m.includes('camry')) return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop';
    if (m.includes('vios')) return 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=800&auto=format&fit=crop';
    if (m.includes('cross') || m.includes('corolla')) return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop';
  }

  if (b.includes('mazda')) {
    if (m.includes('cx-5') || m.includes('cx5')) return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=800&auto=format&fit=crop';
  }

  if (b.includes('honda')) {
    if (m.includes('cr-v') || m.includes('crv')) return 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=800&auto=format&fit=crop';
    if (m.includes('city') || m.includes('civic')) return 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=800&auto=format&fit=crop';
  }

  if (b.includes('vinfast')) {
    if (m.includes('vf8') || m.includes('vf9') || m.includes('vf 8') || m.includes('vf 9')) return 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=800&auto=format&fit=crop';
  }

  if (b.includes('ford')) {
    if (m.includes('ranger') || m.includes('everest')) return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=800&auto=format&fit=crop';
    return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=800&auto=format&fit=crop';
  }

  if (b.includes('mercedes') || b.includes('bmw') || b.includes('audi') || b.includes('porsche')) {
    return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=800&auto=format&fit=crop';
  }

  // Default elegant SUV/Sedan image
  return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=800&auto=format&fit=crop';
}

export function getCarHealthStatus(currentKm: number, lastOilKm?: number, lastOilDate?: string): CarHealthBadge {
  const issues: string[] = [];
  const kmSinceOil = lastOilKm !== undefined ? currentKm - lastOilKm : currentKm % 10000;

  if (kmSinceOil > 6000) {
    issues.push(`⚠️ Quá hạn thay dầu ${ (kmSinceOil - 5000).toLocaleString('vi-VN') } km`);
  } else if (kmSinceOil > 4500) {
    issues.push(`🔔 Sắp đến kỳ thay dầu (còn ~${ (5000 - kmSinceOil).toLocaleString('vi-VN') } km)`);
  }

  // General maintenance checks based on odometer mileage
  if (currentKm > 40000 && currentKm % 20000 < 1000) {
    issues.push('⚠️ Cần kiểm tra má phanh & dầu phanh');
  }

  if (currentKm > 30000 && currentKm % 30000 < 1000) {
    issues.push('🔔 Cần kiểm tra lọc gió động cơ & lọc cabin');
  }

  if (issues.some(i => i.startsWith('⚠️'))) {
    return {
      status: 'red',
      label: 'Cần Bảo Dưỡng Khẩn Cấp',
      color: '#F87171',
      bgColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      icon: '🔴',
      issues,
    };
  }

  if (issues.some(i => i.startsWith('🔔'))) {
    return {
      status: 'yellow',
      label: 'Sắp Đến Kỳ Bảo Dưỡng',
      color: '#FBBF24',
      bgColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      icon: '🟡',
      issues,
    };
  }

  return {
    status: 'green',
    label: 'An Tâm — Đạt Chuẩn 100%',
    color: '#34D399',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    icon: '🟢',
    issues: ['✅ Động cơ & các hệ thống vận hành tốt'],
  };
}
