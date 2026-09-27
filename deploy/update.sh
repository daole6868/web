#!/usr/bin/env bash
# Cập nhật code mới từ GitHub rồi khởi động lại website (dữ liệu trong data/ và uploads/ được giữ nguyên)
set -euo pipefail
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
[ "$(id -u)" -eq 0 ] || { echo "Hãy chạy: sudo bash deploy/update.sh"; exit 1; }
cd "$APP_DIR"
if [ -d .git ]; then
  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  git pull --ff-only
else
  echo "Thư mục không phải git — hãy tải file mới lên bằng WinSCP rồi chạy lại lệnh này để khởi động lại."
fi
chown -R novaboost:novaboost data uploads
systemctl restart nova-boost
sleep 1
systemctl is-active --quiet nova-boost && echo "✅ Đã cập nhật & khởi động lại website." || { journalctl -u nova-boost -n 30 --no-pager; exit 1; }
