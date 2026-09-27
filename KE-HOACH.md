# 📐 KẾ HOẠCH THIẾT KẾ WEBSITE GIỚI THIỆU DỊCH VỤ

> Tài liệu mô tả chi tiết ý tưởng, bố cục, hệ thống thiết kế, chức năng và lộ trình phát triển.
> Bản xem trước (chạy trên máy tính) đã được hiện thực đầy đủ theo kế hoạch này.

---

## 1. Mục tiêu

| Mục tiêu | Cách đạt được |
|---|---|
| Giới thiệu dịch vụ rõ ràng, chuyên nghiệp | Thẻ dịch vụ + bộ lọc theo nhóm + cửa sổ chi tiết + bảng giá |
| Khách dễ liên hệ nhất có thể | Nút gọi/Zalo/Messenger nổi, form liên hệ, bấm-để-gọi, sao chép nhanh, bản đồ |
| Đẹp, hiện đại, có "cảm xúc" | Nền động, hiệu ứng cuộn, thẻ nghiêng 3D, nhạc nền, chế độ sáng/tối |
| Tự quản lý không cần biết code | Trang quản trị: sửa mọi nội dung, màu sắc, nhạc, ẩn/hiện mục |
| Nhìn tốt trên mọi thiết bị | Thiết kế responsive: máy tính → máy tính bảng → điện thoại |

---

## 2. Sơ đồ trang (Sitemap)

```
index.html  (trang một trang – cuộn mượt giữa các mục)
├── Thanh thông báo (ưu đãi / tin mới – bật/tắt được)
├── Header dính: Logo • Menu (tự làm nổi mục đang xem) • Sáng/Tối • Nút Liên hệ
├── 1. Trang chủ (Hero)   – Tiêu đề lớn, chữ gõ phím, 2 nút CTA, thẻ hồ sơ 3D, nhãn bay
├── 2. Giới thiệu         – Đoạn giới thiệu, điểm nổi bật, ô "5+ năm", bộ đếm số liệu
├── 3. Dịch vụ            – Bộ lọc nhóm, thẻ dịch vụ, cửa sổ chi tiết → "Đăng ký tư vấn"
├── 4. Quy trình          – 4 bước, đường nối chạy dần khi cuộn tới
├── 5. Bảng giá           – 3 gói, gói nổi bật viền gradient, "Chọn gói" → điền sẵn form
├── 6. Đánh giá           – Slider tự chạy, vuốt trên điện thoại, chấm điều hướng
├── 7. Hỏi đáp            – Accordion mở/đóng mượt
├── 8. Liên hệ            – Thẻ thông tin (gọi/email/Zalo/địa chỉ/giờ), MXH, bản đồ, form
├── Footer                – Logo, mô tả, dịch vụ, liên hệ, bản quyền, link Quản trị
└── Thành phần nổi: Trình phát nhạc (trái) • Gọi/Zalo/Messenger + Lên đầu trang (phải)

admin.html  (trang quản trị – có mật khẩu)
├── Tổng quan      – Lượt truy cập, biểu đồ 7 ngày, tin nhắn mới, thao tác nhanh
├── Nội dung chung – Tên web, SEO, thông báo, Hero, Giới thiệu, Số liệu
├── Giao diện      – 8 bảng màu mẫu, màu tuỳ chọn, phông, bo góc, kiểu thẻ, bố cục, hiệu ứng
├── Bố cục & Mục   – Ẩn/hiện, kéo-thả sắp xếp, đổi tên từng mục
├── Dịch vụ / Quy trình / Bảng giá / Đánh giá / Hỏi đáp – Thêm • Sửa • Nhân bản • Xoá • Sắp xếp
├── Liên hệ        – SĐT, email, Zalo, Messenger, địa chỉ, bản đồ, mạng xã hội
├── Âm nhạc        – Bật/tắt, tự phát, âm lượng, danh sách phát (tích hợp / file / link)
├── Tin nhắn       – Hộp thư từ form, tìm kiếm, lọc chưa đọc, xuất Excel (CSV)
└── Sao lưu & Bảo mật – Xuất/nhập file, khôi phục mặc định, đổi mật khẩu
```

---

## 3. Hệ thống thiết kế (Design System)

### 3.1 Màu sắc
- **2 màu chủ đạo** (đổi được trong quản trị): Màu chính `#7c5cff` (tím) + Màu phụ `#22d3ee` (xanh ngọc).
  Gradient 135° giữa 2 màu dùng cho nút chính, logo, điểm nhấn → **toàn trang luôn đồng bộ**.
- **8 bảng màu mẫu hài hoà**: Tím Neon, Hoàng hôn, Rừng xanh, Đại dương, Hồng Pastel, Vàng Sang, Chàm, Bạc hà.
- **Chế độ Tối** (mặc định): nền `#0a0c16`, chữ `#e9ebf8`, chữ phụ `#9ba1c2`.
- **Chế độ Sáng**: nền `#f5f6fb`, chữ `#1a1e3a`, chữ phụ `#5a6186`.
- Màu trạng thái: xanh lá `#22c55e` (thành công), đỏ `#ef4444` (lỗi), vàng `#fbbf24` (sao đánh giá).

### 3.2 Bo góc – "bo nhẹ, đều"
- Một biến duy nhất `--radius` (mặc định **14px**, chỉnh 0–28px trong quản trị).
- Thẻ: `radius` • Nút/ô nhập: `radius × 0.7` • Hộp thoại lớn: `radius × 1.5` • Nhãn/chip: bo tròn hẳn.
  → Mọi góc trên trang cùng một "nhịp", trông hài hoà.

### 3.3 Chữ
- Phông **Be Vietnam Pro** (thiết kế riêng cho tiếng Việt, dấu đẹp). Tuỳ chọn: Montserrat, Nunito, Lexend.
- Cỡ chữ co giãn theo màn hình: Tiêu đề Hero 35–56px • Tiêu đề mục 30–45px • Nội dung 16px • Chú thích 13–14px.

### 3.4 Khoảng cách & bố cục
- Khung nội dung rộng tối đa **1200px**, lề 24px (điện thoại 16px).
- Mỗi mục cách nhau **110px** (điện thoại 80px). Lưới 3 cột → 2 cột → 1 cột theo màn hình.
- Tiêu đề mục thống nhất: nhãn nhỏ viết hoa + tiêu đề lớn + mô tả, căn giữa.

### 3.5 Bề mặt thẻ (3 kiểu)
- **Kính mờ (glass)** – nền trong suốt + làm mờ phía sau (mặc định, hợp nền động).
- **Nền đặc** – rõ ràng, dễ đọc. **Viền mảnh** – tối giản.

---

## 3.6 Phong cách theo game (skin) — cho dịch vụ cày thuê

Mỗi phong cách thay đổi đồng bộ: bảng màu nền, phông tiêu đề, kiểu thẻ, kiểu nút, nhãn tiêu đề mục, hiệu ứng nền và hoạ tiết trang trí.

| Skin | Game | Màu | Phông tiêu đề | Hoạ tiết | Nền |
|---|---|---|---|---|---|
| Teyvat | Genshin Impact | Vàng kim `#d8b36a` + ngọc `#72c7c9` | Cormorant Garamond | Khung góc kép, ngôi sao ✦ | Sao + sao băng |
| Solaris | Wuthering Waves | Ngọc `#5fe3d6` + vàng nhạt | Saira (in hoa) | Góc vát, vạch dọc tiêu đề | Sóng âm |
| Astral Express | Honkai: Star Rail | Vàng `#f2c46d` + tím `#a58bff` | Exo 2 | Nhãn nghiêng, vé tàu | Tinh vân + sao |
| New Eridu | Zenless Zone Zero | Chanh `#d4ff1e` + cam `#ff6a1a` | Barlow Condensed nghiêng | Bóng đổ khối, băng sọc, chấm halftone | Chấm tram |
| Talos-II | Arknights: Endfield | Vàng `#ffd000` + đen | Chakra Petch + JetBrains Mono | Sọc cảnh báo, ngoặc [ ], khung góc | Lưới kỹ thuật + vạch quét |
| Hethereau | Neverness to Everness | Hồng `#ff4fa3` + tím `#7a7dff` | Montserrat | Viền neon phát sáng, đường chân trời | Đèn bokeh |

Tất cả phông chữ đều hỗ trợ tiếng Việt. Nhạc tích hợp có thêm 2 bản hợp chủ đề game: **Epic Adventure** (phiêu lưu) và **Neon Night** (synthwave).

---

## 4. Hiệu ứng & chuyển động

| Nhóm | Hiệu ứng |
|---|---|
| Khi mở trang | Màn hình tải (logo xoay + thanh chạy) • Màn hình chào "Vào trang" (tuỳ chọn, bật nhạc luôn) |
| Nền | 7 kiểu: Mạng hạt kết nối (né chuột), Bầu trời sao (có sao băng), Sóng âm, Lưới kỹ thuật + vạch quét, Đèn neon bokeh, Tuyết rơi, Bong bóng • Đốm màu loang trôi chậm • Lưới mờ |
| Khi cuộn | 5 kiểu xuất hiện: Trượt lên, Phóng to, Trượt ngang, Làm rõ từ mờ, Lật 3D • Xuất hiện so le từng thẻ • Thanh tiến trình đọc trên cùng • Header ẩn khi cuộn xuống, hiện khi cuộn lên |
| Tương tác | Thẻ nghiêng 3D + đèn soi theo chuột • Nút có vệt sáng lướt + gợn sóng khi bấm • Vầng sáng đi theo con trỏ • Viên "pill" trượt theo menu |
| Nội dung | Chữ gõ phím tự động • Bộ đếm số chạy • Đường quy trình chạy dần • Slider đánh giá • Accordion mượt |
| Chuyển Sáng/Tối | Vòng tròn lan toả từ vị trí bấm (View Transitions API) |
| Âm nhạc | Đĩa xoay, sóng nhạc (visualizer), **nền + nút "nhún" theo nhịp bass** |
| Tôn trọng người dùng | Tự tắt chuyển động nếu máy bật "Giảm chuyển động" • Có công tắc tắt chuyển động trong quản trị |

---

## 5. Âm nhạc

- **4 bản nhạc tích hợp** được *tạo trực tiếp bằng trình duyệt* (Web Audio API): Lofi Chill, Ambient Dream, Piano Calm, Upbeat Energy.
  → Không cần file, chạy offline, **không lo bản quyền**, mỗi lần nghe có chút ngẫu hứng khác nhau.
- **Tải file MP3 của bạn** lên trong trang quản trị (lưu trong trình duyệt) hoặc **thêm link nhạc** (`https://…mp3` hoặc `music/ten-bai.mp3`).
- Trình phát: phát/tạm dừng, bài trước/sau, ngẫu nhiên, danh sách phát, âm lượng (nhớ lựa chọn của khách), thanh tiến trình tua được, sóng nhạc.
- **Lưu ý về tự phát**: mọi trình duyệt đều chặn nhạc tự phát khi chưa có thao tác. Giải pháp: (1) phát ở lần chạm/nhấp đầu tiên, hoặc (2) bật *Màn hình chào* – khách bấm "Vào trang" là nhạc bắt đầu.

---

## 6. Trang quản trị

- Đăng nhập bằng mật khẩu (mặc định **`admin123`** – đổi ngay ở mục *Sao lưu & Bảo mật*), có "Ghi nhớ đăng nhập".
- Mọi chỉnh sửa hiện chỉ báo **"Chưa lưu"** → bấm **Lưu thay đổi** (hoặc `Ctrl + S`). Có nút *Huỷ thay đổi*, cảnh báo khi rời trang chưa lưu.
- **Trang chủ đang mở ở tab khác sẽ tự tải lại** ngay khi bạn lưu → xem kết quả tức thì.
- Danh sách (dịch vụ, gói, đánh giá…): thêm, sửa trong hộp thoại, nhân bản, xoá, **kéo-thả sắp xếp**, ẩn/hiện.
- Xem trước màu sắc ngay trong trang Giao diện.
- Hộp thư: tin nhắn từ form liên hệ, đánh dấu đã đọc, tìm kiếm, gọi/Zalo nhanh, **xuất Excel (CSV)**.
- Sao lưu toàn bộ ra file `.json` và khôi phục trên máy khác.

---

## 7. Cấu trúc mã nguồn

```
web/
├── index.html        Trang chính
├── admin.html        Trang quản trị
├── css/
│   ├── style.css     Hệ thống thiết kế + giao diện trang chính (dùng chung cho admin)
│   ├── skins.css     6 phong cách giao diện theo game
│   └── admin.css     Giao diện riêng trang quản trị
├── js/
│   ├── store.js      Dữ liệu mặc định, lưu trữ (localStorage/IndexedDB), bộ icon
│   ├── music.js      Bộ tạo nhạc Web Audio + trình phát
│   ├── main.js       Dựng trang chính từ dữ liệu + toàn bộ hiệu ứng
│   └── admin.js      Trang quản trị
├── music/            (tuỳ chọn) đặt file .mp3 của bạn ở đây
├── start-windows.bat Mở nhanh trên Windows
├── start-mac-linux.sh Mở nhanh trên macOS / Linux
└── KE-HOACH.md       Tài liệu này
```

Không cần cài đặt, không cần build — chỉ HTML/CSS/JavaScript thuần, nhẹ và nhanh.

---

## 8. Lộ trình đưa lên mạng (giai đoạn tiếp theo)

Bản hiện tại lưu dữ liệu **trong trình duyệt của máy bạn** – hoàn hảo để xem trước và tự chỉnh.
Để website hoạt động thật trên Internet cho mọi người:

| Giai đoạn | Việc cần làm | Gợi ý |
|---|---|---|
| **1. Nội dung thật** | Thay tên, logo, dịch vụ, giá, số điện thoại, ảnh… qua trang quản trị | Xuất file sao lưu `.json` để giữ lại |
| **2. Tên miền + Hosting** | Mua tên miền (.vn / .com), đưa web lên host tĩnh | Netlify, Vercel, Cloudflare Pages, GitHub Pages (miễn phí) |
| **3. Backend (máy chủ)** | Lưu nội dung & tin nhắn trên máy chủ, đăng nhập an toàn | Firebase / Supabase (có gói miễn phí) – thay `Store` bằng API |
| **4. Thông báo tin nhắn** | Gửi email / Telegram / Zalo khi khách để lại lời nhắn | Formspree, EmailJS, Telegram Bot |
| **5. Hình ảnh** | Thêm mục Dự án / Thư viện ảnh, tải ảnh lên | Cloudinary, Supabase Storage |
| **6. SEO & đo lường** | Sitemap, ảnh chia sẻ Facebook (Open Graph), Google Analytics, Search Console | |
| **7. Mở rộng** | Blog / Tin tức, đa ngôn ngữ (Việt – Anh), đặt lịch hẹn, chat trực tuyến | |

---

## 9. Bạn cần chuẩn bị gì?

- [ ] Tên thương hiệu, khẩu hiệu, logo (nếu có)
- [ ] Danh sách dịch vụ thật: tên, mô tả, giá, quyền lợi
- [ ] Các gói giá (nếu có)
- [ ] Số điện thoại, Zalo, email, Facebook/Messenger, địa chỉ, giờ làm việc
- [ ] Vài đánh giá thật của khách hàng
- [ ] Màu sắc yêu thích (hoặc chọn 1 trong 8 bảng màu mẫu)
- [ ] Nhạc nền muốn dùng (file MP3 bạn có quyền sử dụng) – hoặc dùng nhạc tích hợp
