#!/usr/bin/env bash
# ==========================================================================
#  Cài đặt website NOVA BOOST lên VPS Ubuntu (22.04 / 24.04) — chạy 1 lần
#  Cách dùng:  sudo bash deploy/install.sh tenmien.com email@cuaban.com
# ==========================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="novaboost"

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m⚠️  %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m❌ %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Hãy chạy bằng quyền root:  sudo bash deploy/install.sh tenmien.com email@cuaban.com"
[ -n "$DOMAIN" ] || die "Thiếu tên miền. Ví dụ:  sudo bash deploy/install.sh novaboost.vn ban@gmail.com"
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#www.}"; DOMAIN="${DOMAIN%/}"
[ -f "$APP_DIR/server/server.js" ] || die "Không thấy server/server.js — hãy chạy lệnh từ thư mục code website."
case "$APP_DIR" in /root/*|/home/*) die "Code đang ở $APP_DIR. Hãy đặt code vào /var/www/nova-boost (xem DEPLOY.md) rồi chạy lại.";; esac

say "Cập nhật hệ thống & cài công cụ cần thiết"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get -o Dpkg::Options::=--force-confold -o Dpkg::Options::=--force-confdef upgrade -y
apt-get install -y curl ca-certificates gnupg nginx ufw git

say "Cài Node.js 22 LTS"
if ! command -v node >/dev/null 2>&1 || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

say "Tạo tài khoản hệ thống riêng cho website ($APP_USER)"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR/data" "$APP_DIR/uploads/music"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/data" "$APP_DIR/uploads"
chmod 750 "$APP_DIR/data"

say "Cài dịch vụ tự chạy (systemd)"
sed "s#__APP_DIR__#$APP_DIR#g" "$APP_DIR/deploy/nova-boost.service" > /etc/systemd/system/nova-boost.service
systemctl daemon-reload
systemctl enable nova-boost
systemctl restart nova-boost
sleep 2
systemctl is-active --quiet nova-boost || { journalctl -u nova-boost -n 30 --no-pager; die "Website không khởi động được (xem lỗi ở trên)."; }

say "Cấu hình Nginx cho $DOMAIN"
sed "s/__DOMAIN__/$DOMAIN/g" "$APP_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/nova-boost
ln -sf /etc/nginx/sites-available/nova-boost /etc/nginx/sites-enabled/nova-boost
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

say "Bật tường lửa (chỉ mở SSH, HTTP, HTTPS)"
SSH_PORT="$(ss -tlnp 2>/dev/null | awk '/sshd/ {split($4,a,":"); print a[length(a)]; exit}')"
ufw allow "${SSH_PORT:-22}/tcp"
ufw allow 'Nginx Full'
ufw --force enable

say "Cài chứng chỉ HTTPS miễn phí (Let's Encrypt)"
apt-get install -y certbot python3-certbot-nginx
CERT_ARGS=(--nginx --non-interactive --agree-tos --redirect)
if [ -n "$EMAIL" ]; then CERT_ARGS+=(-m "$EMAIL"); else CERT_ARGS+=(--register-unsafely-without-email); fi
if certbot "${CERT_ARGS[@]}" -d "$DOMAIN" -d "www.$DOMAIN"; then
  HTTPS_OK=1
elif certbot "${CERT_ARGS[@]}" -d "$DOMAIN"; then
  HTTPS_OK=1; warn "Chưa có bản ghi DNS cho www.$DOMAIN — chỉ cấp HTTPS cho $DOMAIN."
else
  HTTPS_OK=0; warn "Chưa cấp được HTTPS. Thường do tên miền chưa trỏ về IP VPS. Trỏ xong chạy lại:  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

IP="$(curl -s --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')"
printf '\n\033[1;32m✅ HOÀN TẤT!\033[0m\n'
if [ "${HTTPS_OK:-0}" = 1 ]; then echo "   Website:      https://$DOMAIN"; echo "   Quản trị:     https://$DOMAIN/admin"
else echo "   Website:      http://$DOMAIN  (hoặc http://$IP)"; echo "   Quản trị:     http://$DOMAIN/admin"; fi
echo "   Mật khẩu đầu: admin123  ← ĐỔI NGAY trong Quản trị → Sao lưu & Bảo mật"
echo
echo "   Lệnh hữu ích:"
echo "     Xem trạng thái:   sudo systemctl status nova-boost"
echo "     Xem nhật ký:      sudo journalctl -u nova-boost -f"
echo "     Cập nhật code:    sudo bash $APP_DIR/deploy/update.sh"
