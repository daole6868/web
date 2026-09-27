#!/bin/sh
# Khởi động website tại http://localhost:8000
cd "$(dirname "$0")"
URL="http://localhost:8000/index.html"
open_url() { (command -v open >/dev/null && open "$1") || (command -v xdg-open >/dev/null && xdg-open "$1") || echo "Mở trình duyệt tới: $1"; }
if command -v python3 >/dev/null 2>&1; then
  echo "Website đang chạy tại $URL  (Ctrl + C để tắt)"
  (sleep 1 && open_url "$URL") &
  python3 -m http.server 8000
else
  echo "Không tìm thấy Python — mở trực tiếp index.html"
  open_url "index.html"
fi
