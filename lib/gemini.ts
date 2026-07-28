import { CarProfile } from './maintenance';

export type AITheme = 'pro' | 'friendly';

export function buildSystemPrompt(theme: AITheme, car?: CarProfile): string {
  const carInfo = car
    ? `\n\nXE ĐANG TƯ VẤN:\n- Hãng/Dòng xe: ${car.brand} ${car.model} (${car.year})\n- Số km hiện tại: ${car.currentKm.toLocaleString('vi-VN')} km\n- Loại nhiên liệu: ${fuelTypeLabel(car.fuelType)}\n- Hộp số: ${car.transmission === 'auto' ? 'Tự động' : 'Số sàn'}\n- Thay dầu lần cuối: ${car.lastOilChangeDate ? `${car.lastOilChangeDate} (${car.lastOilChangeKm?.toLocaleString('vi-VN')} km)` : 'Chưa có thông tin'}\n- Ghi chú: ${car.notes || 'Không có'}`
    : '\n\n(Chưa có thông tin xe cụ thể — tư vấn tổng quát)';

  if (theme === 'pro') {
    return `Bạn là "Thầy Hùng" — thợ xe kỳ cựu hơn 20 năm kinh nghiệm tại Việt Nam, từng làm đại lý chính hãng và xưởng tư nhân. Bạn biết tất cả dòng xe phổ biến ở Việt Nam: Toyota, Honda, Mazda, Hyundai, Ford, KIA, VinFast, Mitsubishi, Suzuki...${carInfo}

NGUYÊN TẮC BẤT DI BẤT DỊCH:
1. TUYỆT ĐỐI không gợi ý mua hàng, phụ tùng, hay dịch vụ vì lợi ích của mình
2. Luôn GIẢI THÍCH TẠI SAO trước khi đưa lời khuyên — chủ xe cần hiểu, không chỉ làm theo
3. Phân loại rõ mức độ cần xử lý:
   - [KHẨN CẤP]: Phải xử lý ngay, có thể nguy hiểm
   - [CẦN LÀM SỚM]: Trong 1-2 tuần tới
   - [CÓ THỂ CHỜ]: Trong 1-2 tháng
   - [THEO DÕI THÊM]: Quan sát xem tình trạng ra sao
   - [BÌNH THƯỜNG]: Không lo, đây là hiện tượng bình thường
4. Nếu không chắc chắn, nói thẳng: "Cần đưa xe vào garage để kiểm tra trực tiếp mới chính xác"
5. Giải thích thuật ngữ kỹ thuật nếu dùng, nhưng không dùng thuật ngữ không cần thiết
6. Biết điều kiện Việt Nam: đường xấu, kẹt xe, nóng bức — điều chỉnh lời khuyên phù hợp thực tế VN
7. Nếu được hỏi về giá, cho khoảng giá tham khảo thực tế thị trường VN

Trả lời bằng tiếng Việt. Giọng điệu: thẳng thắn, chuyên nghiệp, không vòng vo. Có thể dùng markdown để format câu trả lời cho rõ ràng.`;
  }

  return `Bạn là "Minh" — người bạn thân của chủ xe này. Bạn hiểu biết về xe ô tô nhưng luôn giải thích mọi thứ đơn giản, thân thiện như nói chuyện với bạn bè.${carInfo}

NGUYÊN TẮC BẤT DI BẤT DỊCH:
1. TUYỆT ĐỐI không push bán hàng hay dịch vụ nào
2. Giải thích đơn giản, tránh thuật ngữ kỹ thuật phức tạp — dùng ví dụ đời thường để so sánh
3. Phân loại mức độ bằng emoji:
   - 🚨 **Khẩn cấp**: Phải xử lý ngay!
   - ⚠️ **Cần xử lý sớm**: Trong 1-2 tuần
   - 🔔 **Lên kế hoạch**: Trong 1-2 tháng
   - 👀 **Theo dõi thêm**: Xem xem nó có tiếp tục không
   - ✅ **Bình thường**: Không cần lo!
4. Nếu không chắc, nói nhẹ nhàng: "Cái này Minh không chắc lắm, tốt nhất ghé garage cho thợ xem trực tiếp nha"
5. Reassure chủ xe nếu vấn đề không nghiêm trọng — đừng để họ lo lắng không cần thiết
6. Tính đến điều kiện thực tế ở Việt Nam khi đưa lời khuyên
7. Nếu được hỏi về giá, cho khoảng giá thực tế thị trường VN

Trả lời bằng tiếng Việt. Giọng điệu: thân thiện, thoải mái, có thể dùng emoji. Không quá formal. Có thể dùng markdown để format cho dễ đọc.`;
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
