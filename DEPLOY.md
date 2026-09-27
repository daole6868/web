# 🚀 HƯỚNG DẪN ĐƯA WEBSITE LÊN VPS (Ubuntu + tên miền Namecheap)

Thời gian: khoảng **20–30 phút**, phần lớn là chờ tên miền cập nhật.
Sau khi xong, bạn có:

- `https://tenmien.com`: website cho khách xem
- `https://tenmien.com/admin`: trang quản trị. Sửa ở đây là **mọi khách thấy ngay**
- Tin nhắn khách gửi về trang quản trị **và Telegram**

> Trong hướng dẫn, thay `tenmien.com` bằng tên miền của bạn và `123.45.67.89` bằng IP VPS.

---

## Cấu hình VPS cần bao nhiêu?

| | Tối thiểu | VPS của bạn |
|---|---|---|
| RAM | 512 MB | **2 GB** ✅ dư sức |
| Ổ cứng | 5 GB | **20 GB** ✅ |
| CPU | 1 nhân | ✅ |
| Hệ điều hành | Ubuntu 22.04 / 24.04 | ✅ |

Website khi chạy chỉ dùng khoảng **60–100 MB RAM**. Mọi hiệu ứng, nhạc nền đều chạy trên máy của khách, không tốn tài nguyên VPS.
Thứ tốn dung lượng nhất là file nhạc MP3 bạn tải lên (3–8 MB mỗi bài).

---

## Bước 1: Trỏ tên miền về VPS (Namecheap)

1. Đăng nhập **namecheap.com** → **Domain List** → bấm **Manage** cạnh tên miền.
2. Mở tab **Advanced DNS**.
3. Trong **Host Records**, **xoá** các bản ghi mặc định (thường là `CNAME www → parkingpage…` và `URL Redirect @`).
4. Bấm **Add New Record** và thêm 2 bản ghi:

| Type | Host | Value | TTL |
|---|---|---|---|
| A Record | `@` | `123.45.67.89` (IP VPS) | Automatic |
| A Record | `www` | `123.45.67.89` (IP VPS) | Automatic |

5. Bấm ✔ để lưu. Thường mất **5–30 phút** để có hiệu lực.
   Kiểm tra bằng lệnh `ping tenmien.com` trên máy tính: thấy hiện đúng IP VPS là được.

---

## Bước 2: Đăng nhập vào VPS

Trên **Windows**: mở **PowerShell** (hoặc Terminal). Trên **macOS**: mở **Terminal**.

```bash
ssh root@123.45.67.89
```

- Lần đầu máy hỏi `Are you sure…?` → gõ `yes`.
- Nhập mật khẩu root nhà cung cấp VPS gửi cho bạn. Khi gõ, mật khẩu sẽ **không hiện ra**; đó là bình thường.

---

## Bước 3: Tải code lên VPS

### Cách A: Dùng Git (khuyên dùng, cập nhật về sau rất nhanh)

```bash
apt update && apt install -y git
git clone -b claude/nifty-cerf-geik8o https://github.com/daole6868/web.git /var/www/nova-boost
```

> **Nếu repo GitHub đang để riêng tư (private)**, Git sẽ hỏi *Username* và *Password*:
> - Username: tên GitHub của bạn.
> - Password: **không phải mật khẩu GitHub**, mà là một *token*. Cách tạo token:
>   GitHub → ảnh đại diện → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
>   Ở mục *Repository access* chọn repo `web`; ở mục *Permissions → Contents* chọn **Read-only** → tạo token rồi copy dán vào.
>
> Nếu sau này bạn gộp (merge) code vào nhánh `main`, bỏ phần `-b claude/nifty-cerf-geik8o` đi.

### Cách B: Kéo thả bằng WinSCP (không cần Git)

1. Tải **WinSCP** (winscp.net) → đăng nhập: giao thức **SFTP**, Host = IP VPS, User = `root`, mật khẩu root.
2. Bên phải (VPS), vào thư mục `/var/www`, tạo thư mục mới tên **`nova-boost`**.
3. Kéo **toàn bộ file và thư mục** của website từ máy bạn vào `/var/www/nova-boost`
   (gồm `index.html`, `admin.html`, `css`, `js`, `server`, `deploy`, `music`…).

---

## Bước 4: Chạy lệnh cài đặt tự động

```bash
cd /var/www/nova-boost
sudo bash deploy/install.sh tenmien.com email-cua-ban@gmail.com
```

Script sẽ tự động làm hết (mất khoảng 3–5 phút):

- Cập nhật Ubuntu, cài **Node.js 22**, **Nginx**, tường lửa.
- Tạo dịch vụ **tự chạy website**: VPS khởi động lại hay website gặp lỗi đều tự bật lại.
- Cấu hình tên miền và cấp **HTTPS miễn phí** (ổ khoá 🔒). Email dùng để Let's Encrypt báo khi chứng chỉ sắp hết hạn; chứng chỉ tự gia hạn.
- Mở tường lửa: chỉ mở SSH, HTTP và HTTPS.

Cuối cùng màn hình hiện **✅ HOÀN TẤT!** kèm đường dẫn website.

> ⚠️ **Nếu báo "Chưa cấp được HTTPS":** do tên miền chưa trỏ xong (Bước 1). Đợi thêm chút rồi chạy:
> `sudo certbot --nginx -d tenmien.com -d www.tenmien.com`

---

## Bước 5: Vào trang quản trị & bảo mật

1. Mở **`https://tenmien.com/admin`**.
2. Đăng nhập bằng mật khẩu **`admin123`**.
3. Vào **Sao lưu & Bảo mật** → **đổi mật khẩu ngay**. Dùng ít nhất 8 ký tự, nên có chữ hoa, số và ký tự đặc biệt.
4. Vào **Nội dung chung** → tắt *"Hiện liên kết Quản trị ở chân trang"* để khách không thấy đường vào admin.

Sau đó chỉnh nội dung thoải mái. Mỗi lần bấm **Lưu thay đổi** (hoặc `Ctrl + S`), **mọi khách đều thấy bản mới**.

**Về bảo mật đăng nhập:**
- Mật khẩu được mã hoá và kiểm tra trên máy chủ.
- Nhập sai 8 lần sẽ bị khoá 15 phút.
- Chọn *"Ghi nhớ đăng nhập"* thì 30 ngày không phải đăng nhập lại; không chọn thì phiên kéo dài 12 giờ.

---

## Bước 6: Nhận đơn qua Telegram

Làm ngay trong trang quản trị, mục **Thông báo Telegram**:

1. Trên Telegram, tìm **@BotFather** → gửi `/newbot` → đặt tên → nhận **token** (dạng `123456789:AAH…`).
2. Dán token vào ô **Token bot** → bấm **Lưu cài đặt**.
3. Mở bot vừa tạo → bấm **Start**. Muốn nhận vào nhóm: thêm bot vào nhóm rồi nhắn 1 tin trong nhóm.
4. Bấm **Tự tìm** → chọn cuộc trò chuyện của bạn → **Lưu cài đặt**.
5. Bật công tắc → bấm **Gửi thử**. Điện thoại nhận tin ✅ là xong.

Từ giờ, mỗi khi khách gửi form liên hệ, bạn nhận tin dạng:

```
🎮 Đơn mới từ NOVA BOOST
👤 Tên: Trần Minh
📞 SĐT: 0987654321
🎯 Game/Server/UID: HSR – Asia – 800123
💬 Nội dung: Thuê clear Memory of Chaos kỳ này
```

---

## Cập nhật website khi có code mới

Khi mình gửi các file mới, cách cập nhật tuỳ theo cách bạn đã tải code lên ở Bước 3:

**Nếu dùng Git (cách A)**: mình đẩy code lên GitHub, bạn chỉ cần chạy:

```bash
sudo bash /var/www/nova-boost/deploy/update.sh
```

**Nếu dùng WinSCP (cách B)**: kéo các file mới đè lên file cũ trong `/var/www/nova-boost`, rồi chạy:

```bash
sudo systemctl restart nova-boost
```

> Nội dung admin đã chỉnh, tin nhắn và nhạc tải lên nằm trong `data/` và `uploads/`.
> **Cập nhật code không làm mất những dữ liệu này.** Đừng xoá hai thư mục đó.

---

## Sao lưu dữ liệu

- **Cách nhanh:** Quản trị → **Sao lưu & Bảo mật** → **Tải file sao lưu**. File gồm nội dung và tin nhắn.
- **Sao lưu đầy đủ (gồm cả file nhạc):**
  ```bash
  sudo tar czf ~/sao-luu-$(date +%F).tar.gz -C /var/www/nova-boost data uploads
  ```
  Sau đó tải file `sao-luu-….tar.gz` trong thư mục `/root` về máy bằng WinSCP.

---

## Xử lý sự cố thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Vào web báo **502 Bad Gateway** | Website đang tắt. Chạy `sudo systemctl restart nova-boost`, rồi xem lỗi bằng `sudo journalctl -u nova-boost -n 50` |
| **Quên mật khẩu admin** | `sudo bash /var/www/nova-boost/deploy/set-password.sh "MatKhauMoi123"` |
| Bị khoá đăng nhập do nhập sai nhiều | Đợi 15 phút, hoặc chạy `sudo systemctl restart nova-boost` |
| Không có HTTPS / trình duyệt báo "Không an toàn" | Kiểm tra lại DNS (Bước 1), rồi chạy `sudo certbot --nginx -d tenmien.com -d www.tenmien.com` |
| Tải nhạc lên báo lỗi | File phải là nhạc (mp3, m4a, ogg, wav) và nhỏ hơn 40 MB |
| Không nhận được Telegram | Vào mục Thông báo Telegram → bấm **Gửi thử** để xem lỗi. Nhớ bấm **Start** với bot |
| Muốn xem RAM đang dùng | `free -h` và `systemctl status nova-boost` |

---

## Bảo mật VPS (nên làm thêm)

- **Đổi mật khẩu root:** chạy `passwd`.
- **Cập nhật hệ thống định kỳ:** `sudo apt update && sudo apt upgrade -y` (khoảng mỗi tháng một lần).
- **Nâng cao:** đăng nhập SSH bằng khoá (SSH key) thay cho mật khẩu.

---

## Cấu trúc trên VPS

```
/var/www/nova-boost/
├── index.html, admin.html, css/, js/, music/   ← giao diện
├── server/server.js      ← máy chủ (Node.js, không cần cài thư viện)
├── deploy/               ← script cài đặt / cập nhật / đổi mật khẩu
├── data/                 ← nội dung, tin nhắn, thống kê, mật khẩu (đã mã hoá)   🔒 không công khai
└── uploads/music/        ← nhạc bạn tải lên
```
