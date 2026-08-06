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

export function buildIntelligentAutomotiveResponse(message: string, car?: CarProfile, theme?: AITheme): string {
  const brand = car?.brand || 'xe';
  const model = car?.model || 'ô tô';
  const year = car?.year ? String(car.year) : '2020';
  const km = car?.currentKm || 45000;
  const kmStr = km.toLocaleString('vi-VN');
  const msgLower = (message || '').toLowerCase().trim();
  const isPro = theme === 'pro';

  // Topic 1: Phanh / Thắng / Tiếng rít phanh
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

  // Topic 2: Thay dầu / Nhớt / Bảo dưỡng định kỳ
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

  // Topic 3: Đèn báo lỗi / Check Engine / Đèn táp lô
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

  // Topic 4: Điều hòa / Máy lạnh / Không mát
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

  // Topic 5: Khung gầm / Tiếng kêu gầm / Phuộc / Rô tuyn / Bi moay ơ
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

  // Topic 6: Hao xăng / Động cơ giật cục / Khói
  if (msgLower.includes('xăng') || msgLower.includes('hao') || msgLower.includes('giật') || msgLower.includes('khói') || msgLower.includes('máy yếu') || msgLower.includes('rung')) {
    return isPro ? `Chào bạn, đối với xe **${brand} ${model} (${year})** hiện tượng tốn xăng hoặc động cơ rung giật có thể do các yếu tố kỹ thuật sau:

### 🔍 Phân Tích Nguyên Nhân:
1. **Bugi & Cuộn cao áp (Mobin) đánh lửa yếu:** Khiến xăng đốt không sạch, vừa tốn xăng vừa làm xe giật cục khi tăng tốc.
2. **Họng hút & Bướm ga bị đóng cặn muội than:** Làm sai lệch tỷ lệ hòa khí Xăng/Gió.
3. **Kim phun nhiên liệu bị nghẹt:** Xăng phun ra dạng giọt thay vì dạng sương.
4. **Lốp xe thiếu áp suất (non hơi):** Tăng ma sát lăn trên mặt đường.

### 🛠️ Giải Pháp Khuyên Dùng:
- Vệ sinh họng hút bướm ga & Kim phun bằng dung dịch chuyên dụng (~350,000đ).
- Kiểm tra thay Bugi Iridium nếu đã chạy trên 40,000 km (~150,000đ - 250,000đ/viên).`
    : `👋 **Minh chào bạn!** Xe **${brand} ${model} (${year})** chạy hao xăng hoặc bị rung giật nhẹ thì làm theo mẹo này của Minh nha:

⚡ **Nguyên nhân chính:**
- Dễ nhất là **Bugi lâu ngày bị đóng chấu** hoặc **Lọc gió bẩn nghẹt**.
- Ngoài ra họng ga bị bám muội than đen cũng làm xe bị khựng khi nhấn ga.

💡 **Cách xử lý nhẹ tiền:**
- Bạn đi vệ sinh họng ga với kim phun tầm **300k**, sẵn tiện thay bộ Bugi mới là xe lại lướt bốc và tiết kiệm xăng ngay nè! 🚗✨`;
  }

  // Topic 7: General Default Response
  return isPro ? `Chào bạn, tôi là Thợ Xe AI SparkGo — chuyên gia tư vấn kỹ thuật xe ô tô tại Việt Nam.

### 🚘 Thông Tin Hồ Sơ Xe Đang Tư Vấn:
- **Dòng xe:** ${brand} ${model} (${year})
- **Số km hiện tại:** ${kmStr} km

### 💡 Lời Khuyên Vận Hành & Bảo Dưỡng Cho Xe ${brand} ${model}:
1. **Định kỳ kiểm tra 5 dung dịch:** Dầu động cơ, nước làm mát, dầu phanh, dầu trợ lực và nước rửa kính.
2. **Duy trì áp suất lốp:** Chuẩn 2.2 – 2.4 bar giúp tiết kiệm nhiên liệu và bảo vệ lốp xe.
3. **Theo dõi lịch bảo dưỡng:** Định kỳ mỗi 5,000 km hoặc 6 tháng/lần.

Bạn cần tôi phân tích kỹ hơn về hiện tượng hay thắc mắc cụ thể nào của xe ${brand} ${model} không?`
    : `👋 **Chào bạn nhé!** Minh là người bạn đồng hành chăm sóc chiếc **${brand} ${model} (${year})** (${kmStr} km) của bạn đây nè.

🚗 **Mẹo nhỏ giữ xe luôn như mới:**
- Bạn nhớ thay dầu máy đúng hạn 5,000 km nha.
- Luôn kiểm tra áp suất lốp khoảng 2.3 kg/cm2 để xe chạy lướt và êm ái.

Bạn đang gặp vấn đề gì với chiếc xe ${brand} ${model} hay cần Minh hỗ trợ thông tin gì cứ thoải mái hỏi nha! ✨`;
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
