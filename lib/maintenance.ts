export interface CarProfile {
  id?: string;
  brand: string;
  model: string;
  year: number;
  currentKm: number;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric';
  transmission: 'auto' | 'manual';
  color?: string;
  lastOilChangeKm?: number;
  lastOilChangeDate?: string;
  lastServiceDate?: string;
  notes?: string;
}


export interface MaintenanceItem {
  id: string;
  name: string;
  nameEn: string;
  intervalKm: number;
  intervalMonths: number;
  lastDoneKm?: number;
  lastDoneDate?: string;
  nextDueKm: number;
  nextDueDate: string;
  urgency: 'overdue' | 'soon' | 'upcoming' | 'ok';
  daysUntilDue: number;
  kmUntilDue: number;
  description: string;
  icon: string;
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgency(daysUntilDue: number, kmUntilDue: number): 'overdue' | 'soon' | 'upcoming' | 'ok' {
  if (daysUntilDue < 0 || kmUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 30 || kmUntilDue <= 500) return 'soon';
  if (daysUntilDue <= 90 || kmUntilDue <= 2000) return 'upcoming';
  return 'ok';
}

export function calculateMaintenance(car: CarProfile): MaintenanceItem[] {
  const today = new Date().toISOString().split('T')[0];
  const currentKm = car.currentKm;

  // Oil change intervals based on fuel type
  const oilIntervalKm = car.fuelType === 'diesel' ? 10000 : car.fuelType === 'hybrid' ? 8000 : 6000;
  const oilIntervalMonths = 6;

  const baseDate = car.lastOilChangeDate || car.lastServiceDate || `${car.year}-01-01`;
  const baseKm = car.lastOilChangeKm || 0;

  const items: Omit<MaintenanceItem, 'urgency' | 'daysUntilDue' | 'kmUntilDue'>[] = [
    {
      id: 'oil',
      name: 'Thay dầu máy',
      nameEn: 'Engine Oil Change',
      intervalKm: oilIntervalKm,
      intervalMonths: oilIntervalMonths,
      lastDoneKm: car.lastOilChangeKm,
      lastDoneDate: car.lastOilChangeDate,
      nextDueKm: baseKm + oilIntervalKm,
      nextDueDate: addMonths(baseDate, oilIntervalMonths),
      description: 'Thay dầu máy và lọc dầu. Dầu máy là "máu" của động cơ.',
      icon: '🛢️',
    },
    {
      id: 'air_filter',
      name: 'Lọc gió động cơ',
      nameEn: 'Engine Air Filter',
      intervalKm: 20000,
      intervalMonths: 12,
      nextDueKm: currentKm + Math.max(0, 20000 - (currentKm % 20000)),
      nextDueDate: addMonths(today, Math.max(0, 12 - (new Date().getMonth() % 12))),
      description: 'Lọc gió sạch giúp động cơ thở tốt hơn, tiết kiệm nhiên liệu.',
      icon: '💨',
    },
    {
      id: 'cabin_filter',
      name: 'Lọc gió điều hòa (cabin)',
      nameEn: 'Cabin Air Filter',
      intervalKm: 15000,
      intervalMonths: 12,
      nextDueKm: currentKm + Math.max(0, 15000 - (currentKm % 15000)),
      nextDueDate: addMonths(today, 6),
      description: 'Lọc không khí vào cabin xe, quan trọng cho sức khỏe người ngồi trong xe.',
      icon: '🌬️',
    },
    {
      id: 'spark_plugs',
      name: 'Bugi',
      nameEn: 'Spark Plugs',
      intervalKm: car.fuelType === 'petrol' ? 40000 : 0,
      intervalMonths: 48,
      nextDueKm: currentKm + Math.max(0, 40000 - (currentKm % 40000)),
      nextDueDate: addMonths(today, 24),
      description: 'Bugi tạo tia lửa đánh lửa hỗn hợp nhiên liệu. Bugi hỏng gây tiêu hao nhiên liệu, giảm công suất.',
      icon: '⚡',
    },
    {
      id: 'brake_fluid',
      name: 'Dầu phanh',
      nameEn: 'Brake Fluid',
      intervalKm: 40000,
      intervalMonths: 24,
      nextDueKm: currentKm + Math.max(0, 40000 - (currentKm % 40000)),
      nextDueDate: addMonths(today, 24),
      description: 'Dầu phanh hút ẩm theo thời gian, làm giảm hiệu quả phanh. Nên thay định kỳ dù xe ít đi.',
      icon: '🛑',
    },
    {
      id: 'coolant',
      name: 'Nước làm mát',
      nameEn: 'Coolant',
      intervalKm: 60000,
      intervalMonths: 36,
      nextDueKm: currentKm + Math.max(0, 60000 - (currentKm % 60000)),
      nextDueDate: addMonths(today, 36),
      description: 'Nước làm mát giúp động cơ không bị quá nhiệt. Kiểm tra mức và chất lượng định kỳ.',
      icon: '💧',
    },
    {
      id: 'tires',
      name: 'Kiểm tra & cân bằng lốp',
      nameEn: 'Tire Check & Balancing',
      intervalKm: 10000,
      intervalMonths: 6,
      nextDueKm: currentKm + Math.max(0, 10000 - (currentKm % 10000)),
      nextDueDate: addMonths(today, 6),
      description: 'Kiểm tra áp suất lốp, độ mòn, cân bằng và chỉnh góc bánh. Quan trọng cho an toàn và tiết kiệm xăng.',
      icon: '🔄',
    },
    {
      id: 'battery',
      name: 'Ắc-quy',
      nameEn: 'Battery',
      intervalKm: 0,
      intervalMonths: 36,
      nextDueKm: 999999,
      nextDueDate: `${car.year + 3}-01-01` > today ? `${car.year + 3}-01-01` : addMonths(today, 12),
      description: 'Ắc-quy thường có tuổi thọ 3-5 năm. Kiểm tra nếu xe khởi động chậm hoặc đèn yếu.',
      icon: '🔋',
    },
    {
      id: 'registration',
      name: 'Đăng kiểm',
      nameEn: 'Vehicle Inspection',
      intervalKm: 0,
      intervalMonths: car.year <= new Date().getFullYear() - 7 ? 12 : 18,
      nextDueKm: 999999,
      nextDueDate: addMonths(today, car.year <= new Date().getFullYear() - 7 ? 12 : 18),
      description: 'Đăng kiểm bắt buộc theo luật. Xe dưới 7 tuổi: 18 tháng/lần. Xe trên 7 tuổi: 12 tháng/lần.',
      icon: '📋',
    },
  ];

  return items
    .filter(item => item.intervalKm > 0 || item.intervalMonths > 0)
    .map(item => {
      const kmUntilDue = item.nextDueKm - currentKm;
      const daysUntilDue = daysBetween(today, item.nextDueDate);
      return {
        ...item,
        kmUntilDue,
        daysUntilDue,
        urgency: getUrgency(daysUntilDue, kmUntilDue),
      };
    })
    .sort((a, b) => {
      const order = { overdue: 0, soon: 1, upcoming: 2, ok: 3 };
      return order[a.urgency] - order[b.urgency];
    });
}
