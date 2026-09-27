#!/usr/bin/env bash
# Đặt lại mật khẩu quản trị (khi quên):  sudo bash deploy/set-password.sh "MatKhauMoi123"
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ "$(id -u)" -eq 0 ] || { echo "Hãy chạy bằng sudo"; exit 1; }
[ -n "${1:-}" ] || { echo 'Cách dùng: sudo bash deploy/set-password.sh "MatKhauMoi123"'; exit 1; }
cd "$APP_DIR"
sudo -u novaboost node server/server.js set-password "$1"
systemctl restart nova-boost
echo "✅ Đã đổi mật khẩu và khởi động lại website."
