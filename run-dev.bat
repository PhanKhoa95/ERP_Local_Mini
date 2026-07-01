@echo off
chcp 65001 >nul
title QTDN - Khởi chạy Dự án
color 0E

echo ============================================
echo   QTDN - Khởi chạy máy chủ phát triển
echo ============================================
echo.

cd /d "%~dp0"

:: Kiểm tra node_modules
if not exist "node_modules" (
    echo [CẢNH BÁO] Thư mục node_modules chưa được tạo.
    echo Đang tiến hành cài đặt thư viện trước...
    echo.
    call install.bat
)

:: Kiểm tra .env
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Tạo file cấu hình .env từ .env.example...
        copy ".env.example" ".env" >nul
    )
)

:: Khởi chạy Vite
echo [INFO] Khởi động máy chủ Vite (pnpm dev)...
echo.
echo [INFO] Khởi động Cloudflare Tunnel ở cửa sổ mới...
start "Cloudflare Tunnel" cmd /c npx cloudflared tunnel --url http://localhost:8017

pnpm dev --host 0.0.0.0 --port 8017
pause
