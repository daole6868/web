# 🎮 NOVA BOOST — Website Cày Thuê Game + Trang Quản Trị

Website một trang giới thiệu dịch vụ **cày thuê game gacha** (Genshin Impact, Wuthering Waves, Honkai: Star Rail,
Zenless Zone Zero, Arknights: Endfield, Neverness to Everness) — hiệu ứng đẹp, có nhạc nền,
**6 phong cách giao diện theo từng game**, và **trang quản trị** để tự chỉnh sửa mọi thứ mà không cần biết code.

## 🎨 Phong cách giao diện (skin)

| Phong cách | Cảm hứng | Đặc trưng |
|---|---|---|
| **Teyvat** | Genshin Impact | Đêm xanh thẫm, vàng kim, chữ có chân thanh lịch, khung góc hoạ tiết, nền sao |
| **Solaris** | Wuthering Waves | Đen tối giản, chữ in hoa, góc vát, nền sóng âm nhún theo nhạc |
| **Astral Express** | Honkai: Star Rail | Tinh vân tím, vàng kim, nhãn nghiêng, bảng giá dạng vé tàu |
| **New Eridu** | Zenless Zone Zero | Truyện tranh đường phố, neon vàng chanh, băng dính sọc chéo, bóng đổ khối |
| **Talos-II** | Arknights: Endfield | Nền sáng công nghiệp, vàng cảnh báo, chữ kỹ thuật, lưới + vạch quét |
| **Hethereau** | Neverness to Everness | Thành phố đêm, neon hồng – tím, đèn bokeh, đường chân trời |
| Nova Neon | Mặc định | Gradient tím – xanh hiện đại |

- **Khách xem thử**: bấm nút 🎮 trên thanh menu → chọn phong cách (chỉ đổi trên máy người xem).
- **Chọn phong cách chính thức**: Trang quản trị → *Giao diện & Hiệu ứng* → *Phong cách game* → **Lưu**.
- Phong cách chỉ dùng màu sắc, phông chữ và hoạ tiết tự vẽ — **không dùng logo hay hình ảnh chính thức** của các game.

📐 Kế hoạch thiết kế: **[KE-HOACH.md](KE-HOACH.md)** · 🚀 Đưa lên VPS: **[DEPLOY.md](DEPLOY.md)**

## 🖥️ Hai chế độ chạy

| | Mở file trực tiếp (xem trước) | Chạy cùng máy chủ `server/server.js` (VPS) |
|---|---|---|
| Admin sửa nội dung | Chỉ máy bạn thấy | **Mọi khách thấy ngay** |
| Tin nhắn form liên hệ | Lưu trong trình duyệt | Lưu trên VPS + **báo Telegram** |
| Mật khẩu admin | Kiểm tra trên trình duyệt | Mã hoá & kiểm tra trên máy chủ |
| Nhạc tải lên | Lưu trong trình duyệt | Lưu trong `uploads/` trên VPS |

Website tự nhận biết chế độ — không cần cấu hình gì.

---

## ▶️ Cách chạy trên máy tính

### Cách 1 — Nhanh nhất (không cần cài gì)
1. Tải thư mục này về máy (GitHub → nút **Code** → **Download ZIP**, rồi giải nén).
2. Nhấp đúp file **`index.html`** → mở bằng **Chrome** hoặc **Edge**.
3. Trang quản trị: mở **`admin.html`** — mật khẩu mặc định: **`admin123`**.

### Cách 2 — Chạy đầy đủ tính năng như trên VPS (cần Node.js 18+)
```bash
node server/server.js
```
Mở <http://localhost:3000> — trang quản trị: <http://localhost:3000/admin> (mật khẩu đầu `admin123`).

### Cách 3 — Chạy bằng máy chủ tĩnh đơn giản
- **Windows**: nhấp đúp **`start-windows.bat`**
- **macOS / Linux**: mở Terminal trong thư mục, chạy `sh start-mac-linux.sh`
- Hoặc tự chạy: `python -m http.server 8000` rồi mở <http://localhost:8000>

> Script cần có **Python** (tải tại python.org). Nếu không có Python, script sẽ mở trực tiếp file `index.html`.

---

## ✨ Tính năng chính

**Trang chủ** — Thanh thông báo • Menu dính tự làm nổi mục đang xem • Hero với chữ gõ phím & thẻ hồ sơ 3D •
Giới thiệu + bộ đếm số • Dịch vụ có bộ lọc & cửa sổ chi tiết • Quy trình • Bảng giá • Slider đánh giá •
Hỏi đáp • Liên hệ (gọi, email, Zalo, bản đồ, form) • Nút gọi/Zalo/Messenger nổi • Trình phát nhạc có sóng nhạc.

**Hiệu ứng** — 4 kiểu nền động • 5 kiểu xuất hiện khi cuộn • Thẻ nghiêng 3D • Vầng sáng theo chuột •
Chuyển sáng/tối dạng vòng tròn lan toả • Nền "nhún" theo nhạc • Màn hình tải & màn hình chào.

**Trang quản trị** — Sửa toàn bộ nội dung • Đổi màu (8 bảng mẫu), phông, bo góc, hiệu ứng •
Ẩn/hiện & kéo-thả sắp xếp các mục • Quản lý nhạc (tích hợp / tải file / link) • Hộp thư khách hàng + xuất Excel •
Sao lưu/khôi phục • Đổi mật khẩu. Lưu bằng nút **Lưu thay đổi** hoặc `Ctrl + S` — tab trang chủ tự cập nhật.

---

## 💡 Mẹo

- Mở **trang chủ** và **trang quản trị** ở 2 tab cạnh nhau: mỗi lần lưu, trang chủ tự tải lại.
- Dữ liệu được lưu **trong trình duyệt của máy này**. Muốn chuyển sang máy khác → *Sao lưu & Bảo mật* → *Tải file sao lưu*.
- Muốn dùng nhạc riêng: vào *Âm nhạc* → **Tải file nhạc lên**, hoặc chép file vào thư mục `music/` rồi thêm link `music/ten-bai.mp3` (cần chạy bằng Cách 2).
- Trình duyệt luôn chặn nhạc tự phát: bật *Tự phát khi khách chạm vào trang* hoặc *Màn hình chào* để nhạc bắt đầu ngay khi khách tương tác.
- Phông chữ & bản đồ Google cần có Internet; khi offline trang vẫn chạy với phông hệ thống.

> 🔒 Khi chạy cùng `server/server.js` (trên VPS), mật khẩu quản trị được mã hoá và kiểm tra trên máy chủ.
> Ở chế độ mở file trực tiếp, mật khẩu chỉ bảo vệ trên trình duyệt — chỉ dùng để xem trước.
