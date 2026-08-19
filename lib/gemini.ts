import { CarProfile } from './maintenance';

export type AITheme = 'pro' | 'friendly';

export interface VehicleMemoryContext {
  title: string;
  memoryType: string;
  date?: string | Date;
  content?: string;
  source?: string;
}

export interface ServiceRecordContext {
  serviceName: string;
  serviceDate?: string | Date;
  odometerKm?: number;
  cost?: number;
  garageName?: string;
}

export interface VehicleDNAContext {
  dnaEngine?: string;
  dnaSuspension?: string;
  dnaBrakes?: string;
  dnaBattery?: string;
  dnaTires?: string;
  dnaElectrical?: string;
}

export function buildSystemPrompt(
  theme: AITheme,
  car?: CarProfile & {
    licensePlate?: string;
    vin?: string;
    totalCost?: number;
    dna?: VehicleDNAContext;
    memories?: VehicleMemoryContext[];
    serviceRecords?: ServiceRecordContext[];
  }
): string {
  let carInfo = '';

  if (car) {
    const memoryList = car.memories && car.memories.length > 0
      ? car.memories.slice(0, 10).map(m => `- [${m.memoryType.toUpperCase()}] ${m.title}${m.content && m.content !== m.title ? `: ${m.content.slice(0, 80)}` : ''}`).join('\n')
      : 'Chưa có ghi chép triệu chứng cũ.';

    const serviceList = car.serviceRecords && car.serviceRecords.length > 0
      ? car.serviceRecords.slice(0, 8).map(s => `- ${s.serviceName} (${s.odometerKm ? `${s.odometerKm.toLocaleString('vi-VN')} km` : 'Chưa rõ km'}${s.garageName ? `, tại ${s.garageName}` : ''}${s.cost ? `, chi phí: ${s.cost.toLocaleString('vi-VN')}đ` : ''})`).join('\n')
      : 'Chưa có lịch sử bảo dưỡng trước đây.';

    const dnaStatus = `
- Động cơ: ${car.dna?.dnaEngine || (car as any).dnaEngine || 'Bình thường'}
- Hệ thống treo (gầm): ${car.dna?.dnaSuspension || (car as any).dnaSuspension || 'Bình thường'}
- Hệ thống phanh: ${car.dna?.dnaBrakes || (car as any).dnaBrakes || 'Bình thường'}
- Bình ắc quy: ${car.dna?.dnaBattery || (car as any).dnaBattery || 'Bình thường'}
- Lốp xe: ${car.dna?.dnaTires || (car as any).dnaTires || 'Bình thường'}
- Hệ thống điện: ${car.dna?.dnaElectrical || (car as any).dnaElectrical || 'Bình thường'}`;

    carInfo = `\n\n══════════════════════════════════════════════════
HỒ SƠ XE ĐANG ĐỒNG HÀNH ("CAR MEMORY"):
- Hãng & Dòng xe: ${car.brand} ${car.model} (Đời ${car.year})
- Số km ODO hiện tại: ${car.currentKm.toLocaleString('vi-VN')} km
- Biển số: ${car.licensePlate || 'Chưa cập nhật'}
- Nhiên liệu: ${fuelTypeLabel(car.fuelType)} | Hộp số: ${car.transmission === 'auto' ? 'Tự động' : 'Số sàn'}
- Lần thay dầu gần nhất: ${car.lastOilChangeDate ? `${car.lastOilChangeDate} (${car.lastOilChangeKm?.toLocaleString('vi-VN')} km)` : 'Chưa ghi nhận'}
- Tổng chi phí đã ghi nhận: ${car.totalCost ? `${car.totalCost.toLocaleString('vi-VN')}đ` : 'Chưa có'}

🧬 TÌNH TRẠNG VEHICLE DNA HIỆN TẠI:${dnaStatus}

🧠 TRÍ NHỚ CỦA BẠN VỀ CHIẾC XE NÀY (LỊCH SỬ ĐÃ QUA):
${memoryList}

📋 LỊCH SỬ BẢO DƯỠNG & SỬA CHỮA ĐÃ LÀM:
${serviceList}
══════════════════════════════════════════════════`;
  } else {
    carInfo = '\n\n(Chưa chọn xe cụ thể — trả lời tư vấn kỹ thuật tổng quát, và nhắc chủ xe chọn hoặc thêm xe để tư vấn chuẩn xác hơn)';
  }

  if (theme === 'pro') {
    return `Bạn là "Thầy Hùng" — AI Thợ Xe thân tín kỳ cựu hơn 20 năm kinh nghiệm tại Việt Nam. Bạn ĐỒNG HÀNH cùng chủ xe và ĐÃ THEO DÕI chiếc xe này qua thời gian.${carInfo}

NGUYÊN TẮC BẤT DI BẤT DỊCH:
1. LUÔN CÁ NHÂN HÓA: Bạn nhớ rõ chiếc ${car ? `${car.brand} ${car.model} (${car.year})` : 'xe'} này. Khi tư vấn, hãy chủ động liên hệ với số ODO (${car ? `${car.currentKm.toLocaleString('vi-VN')} km` : ''}) và lịch sử thay dầu/sửa chữa của chiếc xe này nếu phù hợp.
2. ĐỨNG VỀ PHÍA CHỦ XE: Tuyệt đối không push mua hàng, không ép thay phụ tùng không cần thiết, không thiên vị bất kỳ garage nào.
3. LUÔN GIẢI THÍCH NGUYÊN NHÂN: Giải thích cặn kẽ tại sao xảy ra hiện tượng đó, chủ xe có thể tự làm (DIY) hay cần ra thợ.
4. PHÂN LOẠI MỨC ĐỘ RÕ RÀNG:
   - [KHẨN CẤP]: Cần dừng xe hoặc xử lý ngay lập tức vì nguy hiểm
   - [CẦN LÀM SỚM]: Xử lý trong 1–2 tuần tới
   - [THEO DÕI THÊM]: Quan sát thêm triệu chứng
   - [BÌNH THƯỜNG]: Hiện tượng cơ học bình thường
5. BÁO GIÁ THỰC TẾ VIỆT NAM: Đưa ra khoảng giá phụ tùng & tiền công tham khảo chuẩn thị trường Việt Nam.
6. THÂN TÍN & CHUYÊN NGHIỆP: Giọng điệu như người thợ có tâm, thẳng thắn, không dùng thuật ngữ rườm rà.`;
  }

  return `Bạn là "Minh" — người bạn thân đồng hành am hiểu xe ô tô tại Việt Nam. Bạn hiểu rõ chiếc xe này và luôn đứng về phía chủ xe.${carInfo}

NGUYÊN TẮC:
1. Nói chuyện thân thiện, ấm áp, gần gũi, dùng emoji nhẹ nhàng, dễ hiểu như bạn bè.
2. Biết rõ tình trạng chiếc ${car ? `${car.brand} ${car.model}` : 'xe'} và các lần bảo dưỡng trước đó.
3. Phân loại cấp độ dễ hiểu: 🚨 Khẩn cấp, ⚠️ Cần làm sớm, 🔔 Lên kế hoạch, ✅ Bình thường.
4. Giải thích hiện tượng bằng ngôn ngữ đời thường, cho giá tham khảo tại Việt Nam.
5. Nếu chưa có dữ liệu quan trọng (ví dụ: chưa biết lần thay dầu cuối), hãy nhẹ nhàng nhắc chủ xe chụp bill hoặc lưu lại.`;
}

// Auto-detect and extract vehicle memory / DNA updates from user messages
export function extractMemoryFromMessage(userMsg: string): {
  memoryType: string;
  title: string;
  severity: string;
  dnaSystem?: 'dnaEngine' | 'dnaSuspension' | 'dnaBrakes' | 'dnaBattery' | 'dnaTires' | 'dnaElectrical';
  dnaStatus?: 'good' | 'monitor' | 'urgent';
} | null {
  const msg = (userMsg || '').toLowerCase();

  // Brakes
  if (msg.includes('phanh') || msg.includes('thắng') || msg.includes('dĩa phanh') || msg.includes('má phanh')) {
    const isUrgent = msg.includes('mất phanh') || msg.includes('sâu') || msg.includes('không ăn');
    return {
      memoryType: 'symptom',
      title: isUrgent ? 'Cảnh báo phanh không ăn' : 'Ghi nhận tiếng kêu / kiểm tra phanh',
      severity: isUrgent ? 'urgent' : 'warning',
      dnaSystem: 'dnaBrakes',
      dnaStatus: isUrgent ? 'urgent' : 'monitor',
    };
  }

  // Battery
  if (msg.includes('ắc quy') || msg.includes('bình') || msg.includes('đề không nổ') || msg.includes('hết điện')) {
    return {
      memoryType: 'symptom',
      title: 'Triệu chứng ắc quy / đề nổ yếu',
      severity: 'warning',
      dnaSystem: 'dnaBattery',
      dnaStatus: 'monitor',
    };
  }

  // Suspension / Gầm
  if (msg.includes('gầm') || msg.includes('phuộc') || msg.includes('rô tuyn') || msg.includes('lộc cộc') || msg.includes('rung bánh') || msg.includes('cao tốc rung')) {
    return {
      memoryType: 'symptom',
      title: 'Ghi nhận hiện tượng gầm / rung giật hệ thống treo',
      severity: 'warning',
      dnaSystem: 'dnaSuspension',
      dnaStatus: 'monitor',
    };
  }

  // Tires
  if (msg.includes('lốp') || msg.includes('thủng') || msg.includes('mòn lốp') || msg.includes('áp suất lốp') || msg.includes('xẹp lốp')) {
    return {
      memoryType: 'symptom',
      title: 'Ghi nhận tình trạng lốp xe',
      severity: 'info',
      dnaSystem: 'dnaTires',
      dnaStatus: 'monitor',
    };
  }

  // Engine
  if (msg.includes('động cơ') || msg.includes('máy rung') || msg.includes('nóng máy') || msg.includes('nước làm mát') || msg.includes('khói') || msg.includes('chảy dầu') || msg.includes('check engine')) {
    const isUrgent = msg.includes('quá nhiệt') || msg.includes('báo đỏ') || msg.includes('khói đen');
    return {
      memoryType: 'symptom',
      title: isUrgent ? 'Cảnh báo động cơ / quá nhiệt' : 'Theo dõi động cơ & làm mát',
      severity: isUrgent ? 'urgent' : 'warning',
      dnaSystem: 'dnaEngine',
      dnaStatus: isUrgent ? 'urgent' : 'monitor',
    };
  }

  // Electrical / Air conditioning
  if (msg.includes('điều hòa') || msg.includes('máy lạnh') || msg.includes('đèn') || msg.includes('cầu chì') || msg.includes('cửa điện') || msg.includes('cốp')) {
    return {
      memoryType: 'symptom',
      title: 'Ghi nhận hệ thống điện / điều hòa',
      severity: 'info',
      dnaSystem: 'dnaElectrical',
      dnaStatus: 'monitor',
    };
  }

  // Oil change recorded
  if (msg.includes('đã thay dầu') || msg.includes('vừa thay nhớt') || msg.includes('mới thay dầu')) {
    return {
      memoryType: 'oil_change',
      title: 'Ghi nhận thay dầu động cơ',
      severity: 'info',
      dnaSystem: 'dnaEngine',
      dnaStatus: 'good',
    };
  }

  return null;
}


function fuelTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    petrol: 'Xăng',
    diesel: 'Dầu diesel',
    hybrid: 'Hybrid',
    electric: 'Điện',
  };
  return labels[type] || type;
}

export function buildIntelligentAutomotiveResponse(message: string, car?: CarProfile, theme?: AITheme): string {
  const brand = car?.brand || 'xe';
  const model = car?.model || 'ô tô';
  const year = car?.year ? String(car.year) : '2020';
  const km = car?.currentKm || 45000;
  const kmStr = km.toLocaleString('vi-VN');
  const msgLower = (message || '').toLowerCase().trim();
  const isPro = theme === 'pro';

  // 1. Cốp điện / Cốp xe / Cửa xe / Khóa xe / Kính điện / Smartkey
  if (msgLower.includes('cốp') || msgLower.includes('cửa') || msgLower.includes('khóa') || msgLower.includes('kính') || msgLower.includes('chìa')) {
    return isPro ? `Chào bạn, đối với chiếc **${brand} ${model} (${year})**, sự cố cốp điện hoặc cửa/khóa kẹt không mở được thường do các nguyên nhân kỹ thuật sau:

### 🔍 Phân Tích Nguyên Nhân Kỹ Thuật:
1. **Công Tắc Khóa Cốp Phụ Trong Xe (Trunk Lock Switch):** Đa số các dòng xe ô tô có nút khóa cốp an toàn nằm ở hộc để đồ bên ghế phụ (Glove Box). Nếu nút này vô tình bị bấm tắt (OFF), cốp điện sẽ bị vô hiệu hóa hoàn toàn.
2. **Cầu Chì (Fuse) Cốp Điện Bị Đứt:** Cầu chì bảo vệ ổ khóa ngàm cốp hoặc ty điện bị đứt do quá tải làm mất nguồn điện cấp cho mô tơ.
3. **Mô Tơ Nâng Nâng Ty Điện / Khóa Hít Bị Kẹt:** Ty điện cơ khí lâu ngày bị kẹt bánh răng hoặc cảm biến chống kẹt bị gián đoạn.
4. **Pin Chìa Khóa Smartkey Yếu:** Điện áp pin chìa mỏng dưới 2.8V làm tín hiệu sóng không mở được cốp từ xa.

### 🛠️ Khuyến Nghị & Hướng Xử Lý Khẩn Cấp:
- **Mở cốp khẩn cấp thủ công:** Rút chiếc **chìa khóa cơ phụ** nằm bên trong remote smartkey, cắm vào ổ khóa cơ khẩn cấp dưới cốp sau (hoặc lật hàng ghế sau luồn tay vào chốt mở khẩn cấp).
- **Kiểm tra cầu chì & công tắc phụ:** Kiểm tra nút Trunk Lock trong hộc đồ phụ trước khi mang ra thợ.
- **Chi phí tham khảo:** ~200,000đ (thay cầu chì/pin chìa) đến 1,500,000đ - 3,200,000đ (thay ty điện/ngàm khóa cốp chính hãng).`
    : `👋 **Chào bạn nhé!** Minh xin tư vấn về sự cố cốp điện không mở được trên chiếc **${brand} ${model} (${year})** của bạn nha:

🚗 **Nguyên nhân tại sao cốp điện lại bị kẹt?**
- **Mẹo đầu tiên (rất hay gặp):** Bạn mở hộc để đồ bên ghế phụ xem có nút công tắc khóa cốp phụ (Trunk Lock Switch) bị vô tình bấm tắt không nha!
- **Nguyên nhân 2:** Đứt cầu chì (fuse) điện cốp hoặc pin chìa khóa smartkey bị hết pin.
- **Nguyên nhân 3:** Ty nâng điện cốp hoặc mô tơ ngàm khóa cốp bị hỏng bánh răng.

💡 **Cách mở cốp khẩn cấp từ Minh:**
- Bạn rút chiếc **chìa khóa cơ phụ** nằm bên trong chìa smartkey ra, cắm vào ổ khóa cơ ẩn bên dưới tay nắm cốp sau để mở thủ công lấy đồ nha.
- Sau đó mang xe ghé garage kiểm tra lại cầu chì và ty điện nhé! 🚗✨`;
  }

  // 2. Ắc quy / Bình / Đề không nổ / Củ đề / Máy phát
  if (msgLower.includes('bình') || msgLower.includes('ắc quy') || msgLower.includes('đề') || msgLower.includes('nổ') || msgLower.includes('sạc')) {
    return isPro ? `Chào bạn, hiện tượng xe **${brand} ${model} (${year})** đề không nổ hoặc yếu bình ắc quy được chẩn đoán kỹ thuật như sau:

### 🔍 Phân Tích Nguyên Nhân Kỹ Thuật:
1. **Ắc Quy Bị Sụt Điện / Hết BÌNH (Chiếm 75%):** Ắc quy ô tô có tuổi thọ trung bình 2 – 3 năm. Điện áp chuẩn khi tắt máy là **12.4V – 12.8V**. Nếu điện áp sụt dưới 11.8V, củ đề sẽ nhảy tạch tạch nhưng không đủ sức quay trục khuỷu.
2. **Củ Đề (Starter Motor) Bị Mòn Chổi Than:** Khi bấm đề nghe tiếng "tạch" đơn lẻ nhưng củ đề không quay.
3. **Máy Phát Điện (Alternator) Hỏng:** Máy phát không sạc điện lại cho bình khi xe chạy.

### 🛠️ Hướng Xử Lý Khẩn Cấp:
- **[KHẨN CẤP]**: Dùng bộ dây kích bình nối với xe khác hoặc bộ kích bình di động để nổ máy tạm thời.
- Sau khi nổ máy, giữ xe chạy liên tục 20–30 phút để máy phát sạc bình, sau đó ghé tiệm đo lại dung lượng ắc quy (CCA).
- **Chi phí thay ắc quy tham khảo:** ~1,300,000đ – 2,400,000đ (bình GS, Varta, Amaron chính hãng).`
    : `👋 **Minh chào bạn!** Sự cố đề không nổ trên chiếc **${brand} ${model} (${year})** đây nha:

🔋 **Hiện tượng yếu bình ắc quy:**
- Khi bấm nút đề mà nghe tiếng "tạch tạch tạch" liên tục, đèn táp lô chớp tắt ➔ **100% là bị hết bình ắc quy rồi bạn nhé!**

💡 **Cách xử lý nhanh:**
- Bạn gọi dịch vụ kích bình tận nơi (khoảng 100k-150k) hoặc nhờ xe khác câu dây kích bình sang nha.
- Nếu bình đã xài trên 2 năm thì nên thay bình mới (GS hoặc Varta) giá tầm **1.4 - 2.2 triệu** xài vi vu 3 năm tiếp nè! 🚗✨`;
  }

  // 3. Phanh / Thắng / Tiếng rít phanh
  if (msgLower.includes('phanh') || msgLower.includes('thắng') || msgLower.includes('cót két') || msgLower.includes('rít') || msgLower.includes('dĩa')) {
    return isPro ? `Chào bạn, đối với chiếc **${brand} ${model} (${year})** (ODO: ${kmStr} km), hiện tượng phanh phát ra tiếng kêu là cảnh báo kỹ thuật rất phổ biến. Dưới đây là phân tích chi tiết:

### 🔍 Phân Tích Nguyên Nhân Kỹ Thuật:
1. **Má phanh bị mòn mỏng (Chiếm 80% nguyên nhân):** Má phanh xe ${brand} ${model} được trang bị chốt kim loại báo mòn (wear indicator). Khi lớp ma sát mòn còn dưới 3mm, chốt này cạ trực tiếp vào đĩa phanh tạo tiếng kêu rít rít để cảnh báo chủ xe.
2. **Gỉ sét & Bụi bẩn đĩa phanh:** Xe đi mưa, lội nước ngập hoặc đỗ ngoài trời lâu ngày khiến bề mặt đĩa phanh bị oxy hóa nhẹ hoặc đóng cặn cát bụi.
3. **Chốt trượt cùm phanh (Calliper) khô mỡ:** Chốt bôi trơn bị khô làm má phanh không nhả hết sau khi buông chân phanh, gây ma sát liên tục.

### 🛠️ Khuyến Nghị & Hướng Xử Lý:
- **[CẦN LÀM SỚM]**: Đưa xe ghé xưởng dịch vụ tháo bánh kiểm tra độ dày thực tế của má phanh.
- **Nếu má phanh còn dày (>5mm):** Vệ sinh xịt cặn bụi phanh + tra mỡ chịu nhiệt chốt cùm phanh (~150,000đ).
- **Nếu má phanh mòn mỏng (<3mm):** Thay ngay bộ má phanh mới (Khuyên dùng má phanh chính hãng hoặc Akebono, Hi-Q, Brembo).
- **Chi phí tham khảo:** ~650,000đ – 1,500,000đ / bộ phanh trước xe ${brand} ${model}.`
    : `👋 **Chào bạn nhé!** Minh xin tư vấn về tiếng kêu phanh trên chiếc **${brand} ${model} (${year})** của bạn nè:

🔊 **Nguyên nhân tại sao phanh kêu rít rít?**
- **Dễ bị nhất:** Má phanh xe đã bị mòn mỏng rồi đó bạn! Trên má phanh có thanh kim loại báo mòn, khi mỏng quá nó sẽ cạ vào đĩa phanh phát ra tiếng kêu rít rít để nhắc mình thay.
- **Nguyên nhân khác:** Xe mới đi mưa về bị bám bụi cát hoặc đĩa phanh bị đóng gỉ nhẹ.

⚠️ **Lời khuyên từ Minh:**
- Bạn nên ghé garage quen tháo bánh ra ngó thử độ dày má phanh nha. Nếu mỏng dưới 3mm thì nên thay sớm để tránh làm trầy xước đĩa phanh tốn nhiều tiền hơn.
- Chi phí thay má phanh ${brand} ${model} khoảng **700k - 1.3 triệu** thôi nè. 🚗✨`;
  }

  // 4. Thay dầu / Nhớt / Bảo dưỡng định kỳ
  if (msgLower.includes('dầu') || msgLower.includes('nhớt') || msgLower.includes('bảo dưỡng') || msgLower.includes('lịch') || msgLower.includes('thay')) {
    return isPro ? `Chào bạn, đối với chiếc **${brand} ${model} (${year})** hiện đã chạy **${kmStr} km**, quy trình bảo dưỡng động cơ chuẩn kỹ thuật như sau:

### 🛢️ Lịch Thay Dầu & Bảo Dưỡng Động Cơ:
- **Chu kỳ thay dầu định kỳ:** 
  - Dầu bán tổng hợp (Semi-Synthetic): Thay mỗi **5,000 km** hoặc **6 tháng**.
  - Dầu tổng hợp toàn phần (Fully Synthetic): Thay mỗi **10,000 km** hoặc **12 tháng**.
- **Quy tắc thay lọc dầu:** Chuẩn kỹ thuật là **2 lần thay dầu máy = 1 lần thay cốc lọc dầu mới**.
- **Chỉ số dầu khuyên dùng:** Dầu phẩm cấp 5W-30 hoặc 0W-20 đạt tiêu chuẩn API SP / ILSAC GF-6 tốt nhất cho xe ${brand}.

### 📋 Hạng Mục Kiểm Tra Tại Mốc ${kmStr} km:
- **[CẦN LÀM SỚM]**: Thay dầu động cơ + Lọc dầu.
- **[KIỂM TRA]**: Lọc gió động cơ & Lọc gió điều hòa (vệ sinh bằng vòi xịt hoặc thay nếu quá bẩn).
- **[KIỂM TRA]**: Bổ sung nước làm mát, dầu phanh, kiểm tra áp suất 4 lốp (2.2 - 2.4 bar).
- **Chi phí bảo dưỡng tham khảo:** ~700,000đ – 1,200,000đ cho gói bảo dưỡng định kỳ xe ${brand} ${model}.`
    : `👋 **Minh chào bạn nha!** Về lịch bảo dưỡng và thay dầu cho xe **${brand} ${model} (${year})** (${kmStr} km):

🛢️ **Khi nào nên đi thay dầu?**
- Thường cứ mỗi **5,000 km** hoặc **6 tháng** là mình đi thay dầu 1 lần cho mát máy nha.
- Nhớ quy tắc nằm lòng: **2 lần thay dầu = 1 lần thay lọc dầu**.

💡 **Mẹo chăm xe từ Minh:**
- Bạn nên chọn loại dầu Fully Synthetic (tổng hợp hoàn toàn) 5W-30 chạy máy rất êm và nhẹ ga.
- Gói thay dầu + lọc dầu ${brand} ${model} rơi vào tầm **650k - 950k** thôi nè! 🚗✨`;
  }

  // 5. Đèn báo lỗi / Check Engine / Đèn táp lô
  if (msgLower.includes('đèn') || msgLower.includes('check engine') || msgLower.includes('lỗi') || msgLower.includes('báo lỗi') || msgLower.includes('cảnh báo')) {
    return isPro ? `Chào bạn, việc nổi đèn cảnh báo trên bảng đồng hồ chiếc **${brand} ${model} (${year})** cần được phân loại theo màu sắc để xử lý an toàn:

### ⚠️ Phân Loại Cấp Độ Đèn Cảnh Báo:
1. **Đèn Check Engine (Động cơ) MÀU VÀNG:**
   - **Tình trạng:** Xe vẫn vận hành được tạm thời.
   - **Nguyên nhân phổ biến:** Cảm biến khí thải (O2 sensor), cảm biến lưu lượng khí nạp (MAF), lọc gió quá bẩn, nắp bình xăng đóng chưa chặt hoặc nhiên liệu kém chất lượng.
   - **[CẦN LÀM SỚM]**: Đưa xe ghé garage dùng máy chẩn đoán OBD-II đọc mã lỗi chính xác (DTC code).
2. **Đèn MÀU ĐỎ (Áp suất dầu / Nhiệt độ nước / Bình ắc quy / Phanh):**
   - **[KHẨN CẤP]**: Hãy tấp xe vào lề an toàn và TẮT MÁY NGAY.
   - Không tiếp tục di chuyển vì có thể gây lột dớn, bó máy hoặc cháy nổ hệ thống điện.

### 🛠️ Khuyên Dùng:
Ghé xưởng kiểm tra đọc lỗi OBD-II (thường được miễn phí hoặc chi phí kiểm tra ~100,000đ).`
    : `👋 **Minh chào bạn!** Đèn cảnh báo trên táp-lô chiếc **${brand} ${model} (${year})** nổi lên làm bạn lo lắng đúng không nè?

🚦 **Xem màu đèn để xử lý nè:**
- 🟡 **Đèn MÀU VÀNG (Check Engine...):** Đừng quá hoảng hốt nha, xe vẫn chạy tiếp được chậm chậm. Thường do cảm biến bẩn hoặc nắp xăng hở thôi. Bạn thu xếp ghé garage cắm máy đọc lỗi sớm là xong.
- 🔴 **Đèn MÀU ĐỎ (Nhiệt độ nước / Dầu máy...):** 🚨 **Khẩn cấp!** Bạn tấp xe vô lề an toàn và tắt máy ngay nha, kẻo bị lột vớn lúp-bê máy tốn cả chục triệu đó!

Cần Minh hỗ trợ thêm thông tin gì bạn cứ nhắn nha! 🚗✨`;
  }

  // 6. Điều hòa / Máy lạnh / Không mát
  if (msgLower.includes('điều hòa') || msgLower.includes('máy lạnh') || msgLower.includes('lạnh') || msgLower.includes('nóng') || msgLower.includes('mùi')) {
    return isPro ? `Chào bạn, đối với hệ thống điều hòa xe **${brand} ${model} (${year})**, hiện tượng mát kém hoặc có mùi hôi được chẩn đoán kỹ thuật như sau:

### ❄️ Nguyên Nhân Thường Gặp:
1. **Lọc gió cabin (lọc điều hòa) bị nghẹt bụi (60%):** Lọc gió bám dày bụi bẩn làm giảm lưu lượng gió thổi qua giàn lạnh.
2. **Thiếu Gas lạnh / Rò rỉ hệ thống:** Rò rỉ nhẹ tại các phớt cao su, đường ống nén làm sụt giảm áp suất gas R134a/R1234yf.
3. **Giàn lạnh bị ẩm mốc / Đóng cặn:** Gây ra mùi chua, ẩm mốc khó chịu khi vừa bật máy lạnh.
4. **Lốc lạnh (Compressor) hoặc Quạt dàn nóng yếu.**

### 🛠️ Hướng Xử Lý Khuyên Dùng:
- **[CẦN LÀM SỚM]**: Tháo lọc gió điều hòa kiểm tra (thay mới nếu quá bẩn, giá ~180,000đ - 300,000đ).
- **Vệ sinh giàn lạnh nội soi:** Dùng phương pháp xịt bọt chuyên dụng không tháo táp-lô (~450,000đ - 600,000đ).
- **Kiểm tra áp suất gas & bổ sung gas lạnh:** (~300,000đ - 500,000đ).`
    : `👋 **Minh chào bạn!** Vấn đề máy lạnh trên chiếc **${brand} ${model} (${year})** của bạn đây nè:

❄️ **Tại sao điều hòa không mát sâu hoặc có mùi?**
- **Thường gặp nhất:** Lọc gió điều hòa trong hộc găng tay bị bám bụi đen thui rồi!
- **Nguyên nhân 2:** Gas máy lạnh bị hụt nhẹ hoặc dàn lạnh lâu ngày bị ẩm mốc.

💡 **Giải pháp nhanh từ Minh:**
- Bạn rút lọc gió máy lạnh ra tự kiểm tra thử nha, nếu bẩn quá thay cái mới tầm **150k - 250k** là gió thổi mát rượi liền.
- Nếu thay lọc rồi vẫn chưa lạnh thì ghé garage nhờ thợ kiểm tra lượng gas lạnh nhé! 🚗✨`;
  }

  // 7. Khung gầm / Tiếng kêu gầm / Phuộc / Rô tuyn / Bi moay ơ
  if (msgLower.includes('gầm') || msgLower.includes('phuộc') || msgLower.includes('nhún') || msgLower.includes('rô tuyn') || msgLower.includes('lộc cộc') || msgLower.includes('ù') || msgLower.includes('kêu')) {
    return isPro ? `Chào bạn, tiếng kêu bất thường dưới gầm xe **${brand} ${model} (${year})** (${kmStr} km) là dấu hiệu xuống cấp hệ thống treo/dẫn động:

### 🔍 Phân Tích Tiếng Kêu Gầm Kỹ Thuật:
1. **Kêu "lộc cộc" khi đi vào đường xóc, gờ giảm tốc:**
   - Rô-tuyn cân bằng (Sway bar link) hoặc Rô-tuyn thước lái bị rơ cao su.
   - Bạc cao su càng A bị rách/lão hóa.
2. **Kêu "ù ù" tăng dần theo tốc độ (chạy > 40-50 km/h):**
   - Bi moay-ơ (Bạc đạn bánh xe Wheel Bearing) bị rỗ mòn bạc đạn.
3. **Xe bị chao đảo, chảy dầu phuộc nhún:**
   - Phao giảm xóc (phuộc) bị xì dầu nén, rách tăm bông cao su.

### 🛠️ Khuyến Nghị Kỹ Thuật:
- **[CẦN LÀM SỚM]**: Đưa xe lên cầu nâng để thợ lay kiểm tra độ rơ của hệ thống rô-tuyn & cao su gầm.
- **Chi phí tham khảo:** 
  - Thay rô-tuyn cân bằng xe ${brand} ${model}: ~350,000đ – 750,000đ/cặp.
  - Thay bi moay-ơ: ~800,000đ – 1,800,000đ/bánh.`
    : `👋 **Minh chào bạn!** Về tiếng kêu dưới gầm chiếc **${brand} ${model} (${year})** của bạn:

🔊 **Chẩn đoán nhanh tiếng gầm:**
- Nếu kêu **"lộc cộc"** khi qua ổ gà: Rất hay do cục cao su rô-tuyn cân bằng bị chai rơ rồi.
- Nếu chạy nhanh nghe tiếng **"ù ù"** như tiếng máy bay: Do bạc đạn (bi moay-ơ) bánh xe bị mòn đó bạn.

⚠️ **Lời khuyên từ Minh:**
- Bạn nên mang xe ra garage cho thợ nâng cầu lên lắc thử bánh là lòi ra bệnh ngay. Sửa sớm đi êm ái mà an toàn nữa nha! 🚗✨`;
  }

  // 8. Dynamic Context Analysis for any other custom question
  return isPro ? `Chào bạn, tôi là Thợ Xe AI SparkGo — chuyên gia tư vấn kỹ thuật xe ô tô tại Việt Nam.

### 🚘 Phân Tích Cho Câu Hỏi: "${message}" (${brand} ${model} ${year}):
- **Tình trạng ghi nhận:** Xe hiện đang đạt mốc ODO **${kmStr} km**.
- **Khuyên dùng kỹ thuật:** Đối với sự cố "${message}", bạn nên cho thợ kiểm tra trực tiếp các cụm chi tiết liên quan (cầu chì, hệ thống cấp điện, cảm biến và dây cáp nối) để chẩn đoán chính xác.

### 💡 Lời Khuyên An Toàn:
1. Đảm bảo an toàn hệ thống điện và cơ khí trước khi tháo lắp.
2. Bạn có thể ghé garage uy tín để kiểm tra bằng thiết bị chuyên dụng.`
    : `👋 **Chào bạn nha!** Minh là người bạn đồng hành tư vấn xe **${brand} ${model} (${year})** (${kmStr} km) của bạn đây nè.

🚗 **Về vấn đề "${message}":**
- Vấn đề này cần kiểm tra kỹ phần điện hoặc chi tiết cơ khí tương ứng của xe ${brand} ${model} nha bạn.
- Bạn thử kiểm tra cầu chì hoặc đưa xe ghé xưởng nhờ thợ kiểm tra trực tiếp cho yên tâm nhất nè! 🚗✨`;
}

export const CAR_BRANDS: Record<string, string[]> = {
  Toyota: ['Vios', 'Yaris', 'Corolla Cross', 'Camry', 'Fortuner', 'Innova', 'Rush', 'Raize', 'Veloz', 'Hilux', 'Land Cruiser', 'Prius', 'Sienna'],
  Honda: ['City', 'Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'BR-V', 'WR-V', 'Pilot'],
  Mazda: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-8', 'BT-50'],
  Hyundai: ['Grand i10', 'Accent', 'Elantra', 'Tucson', 'Santa Fe', 'Kona', 'Stargazer', 'Creta'],
  Ford: ['EcoSport', 'Territory', 'Explorer', 'Everest', 'Ranger', 'Transit', 'Mustang'],
  KIA: ['Morning', 'Soluto', 'K3', 'K5', 'Seltos', 'Sportage', 'Sorento', 'Carnival', 'Telluride'],
  VinFast: ['Fadil', 'Lux A2.0', 'Lux SA2.0', 'VF3', 'VF5', 'VF6', 'VF7', 'VF8', 'VF9'],
  Mitsubishi: ['Attrage', 'Outlander', 'Xpander', 'Pajero Sport', 'Triton', 'Eclipse Cross'],
  Suzuki: ['Swift', 'Ertiga', 'XL7', 'Vitara', 'Ciaz'],
  Nissan: ['Almera', 'Terra', 'Navara', 'X-Trail'],
  Subaru: ['Forester', 'Outback', 'XV', 'Impreza'],
  Mercedes: ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS'],
  BMW: ['1 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5', 'X7'],
  Audi: ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
  Khác: [],
};

export const QUICK_PROMPTS_PRO = [
  'Xe tôi đã đến lịch thay dầu chưa?',
  'Kiểm tra trước chuyến đi xa cần làm gì?',
  'Tiếng kêu lạ khi phanh — nguyên nhân là gì?',
  'Đèn Check Engine sáng — có nguy hiểm không?',
  'Xe tốn xăng hơn bình thường — nguyên nhân?',
  'Điều hòa yếu, không lạnh như trước — sao vậy?',
];

export const QUICK_PROMPTS_FRIENDLY = [
  '🛢️ Xe mình cần thay dầu chưa?',
  '🚗 Chuẩn bị gì trước khi đi xa?',
  '🔊 Có tiếng kêu lạ khi đạp phanh — lo không?',
  '⚠️ Đèn vàng trên bảng điều khiển sáng — sao vậy?',
  '⛽ Xe uống xăng nhiều hơn bình thường?',
  '❄️ Máy lạnh không mát như trước?',
];
