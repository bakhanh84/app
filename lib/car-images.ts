export interface CarHealthBadge {
  status: 'green' | 'yellow' | 'red';
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  issues: string[];
}

export function getCarImageUrl(brand: string, model: string, year?: number | string): string {
  const b = (brand || '').toLowerCase().trim();
  const m = (model || '').toLowerCase().trim();
  const y = typeof year === 'number' ? year : parseInt(String(year || '0'), 10) || 0;

  // --- TOYOTA ---
  if (b.includes('toyota')) {
    if (m.includes('camry')) {
      if (y > 0 && y < 2019) return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1000&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('vios')) {
      if (y > 0 && y < 2019) return 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1000&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('cross') || m.includes('corolla')) {
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('fortuner') || m.includes('hilux') || m.includes('prado')) {
      return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('innova') || m.includes('veloz') || m.includes('raize') || m.includes('yaris')) {
      return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1000&auto=format&fit=crop';
  }

  // --- VINFAST ---
  if (b.includes('vinfast')) {
    if (m.includes('vf8') || m.includes('vf 8') || m.includes('vf9') || m.includes('vf 9')) {
      return 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('vf5') || m.includes('vf 5') || m.includes('vf3') || m.includes('vf 3') || m.includes('vfe34') || m.includes('vf e34')) {
      return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('vf6') || m.includes('vf 6') || m.includes('vf7') || m.includes('vf 7')) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('fadil')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('lux')) {
      return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=1000&auto=format&fit=crop';
  }

  // --- HYUNDAI ---
  if (b.includes('hyundai')) {
    if (m.includes('santa fe') || m.includes('santafe')) {
      if (y > 0 && y < 2021) return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('tucson') || m.includes('creta')) {
      return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('accent') || m.includes('elantra')) {
      return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('i10') || m.includes('grand i10')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop';
  }

  // --- KIA ---
  if (b.includes('kia')) {
    if (m.includes('seltos') || m.includes('sonet') || m.includes('sorento') || m.includes('carnival')) {
      return 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('k3') || m.includes('cerato') || m.includes('k5') || m.includes('optima')) {
      return 'https://images.unsplash.com/photo-1541348263662-e068662d82af?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('morning') || m.includes('soluto')) {
      return 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?q=80&w=1000&auto=format&fit=crop';
  }

  // --- MAZDA ---
  if (b.includes('mazda')) {
    if (m.includes('cx-5') || m.includes('cx5') || m.includes('cx-8') || m.includes('cx8') || m.includes('cx-30') || m.includes('cx30')) {
      return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('mazda 3') || m.includes('mazda3') || m.includes('mazda 2') || m.includes('mazda2') || m.includes('mazda 6') || m.includes('mazda6')) {
      return 'https://images.unsplash.com/photo-1541348263662-e068662d82af?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';
  }

  // --- HONDA ---
  if (b.includes('honda')) {
    if (m.includes('cr-v') || m.includes('crv') || m.includes('hr-v') || m.includes('hrv')) {
      return 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('city') || m.includes('civic') || m.includes('accord')) {
      return 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1000&auto=format&fit=crop';
  }

  // --- FORD ---
  if (b.includes('ford')) {
    if (m.includes('ranger') || m.includes('raptor')) {
      if (y > 0 && y < 2022) return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=1000&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=1000&auto=format&fit=crop';
    }
    if (m.includes('everest') || m.includes('territory') || m.includes('explorer')) {
      return 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=1000&auto=format&fit=crop';
  }

  // --- MITSUBISHI ---
  if (b.includes('mitsubishi')) {
    if (m.includes('xpander') || m.includes('outlander') || m.includes('pajero') || m.includes('triton')) {
      return 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1000&auto=format&fit=crop';
  }

  // --- LUXURY BRANDS (BMW, MERCEDES, AUDI, LEXUS, PORSCHE, VOLVO) ---
  if (b.includes('bmw')) {
    if (m.includes('3 series') || m.includes('320i') || m.includes('330i')) {
      if (y > 0 && y < 2019) return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop';
      return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop';
  }

  if (b.includes('mercedes') || b.includes('benz')) {
    return 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop';
  }

  if (b.includes('porsche')) {
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1000&auto=format&fit=crop';
  }

  if (b.includes('lexus') || b.includes('audi') || b.includes('volvo') || b.includes('land rover')) {
    return 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1000&auto=format&fit=crop';
  }

  // --- GENERIC FALLBACK BY CAR TYPE OR YEAR ---
  if (m.includes('suv') || m.includes('cuv') || m.includes('cross')) {
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';
  }

  if (m.includes('bán tải') || m.includes('pickup') || m.includes('truck')) {
    return 'https://images.unsplash.com/photo-1551830820-330a71b99659?q=80&w=1000&auto=format&fit=crop';
  }

  if (y > 0 && y < 2016) {
    return 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1000&auto=format&fit=crop';
  }

  // Default elegant modern car image
  return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1000&auto=format&fit=crop';
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
