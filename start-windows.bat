@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Dang khoi dong website tai http://localhost:8000 ...
echo (Dong cua so nay de tat)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" http://localhost:8000/index.html
  python -m http.server 8000
) else (
  echo Khong tim thay Python - mo truc tiep file index.html
  start "" index.html
)
