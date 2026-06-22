@echo off
chcp 65001 >nul
title QTDN - Cài đặt thư viện dự án
color 0A

echo ============================================
echo   QTDN - Quản trị doanh nghiệp
echo   Cài đặt thư viện tự động
echo ============================================
echo.

:: Kiểm tra Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [LỖI] Chưa cài đặt Node.js!
    echo Vui lòng tải và cài đặt tại: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Hiển thị phiên bản Node.js
echo [INFO] Phiên bản Node.js hiện tại:
node -v
echo.

:: Kiểm tra pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] pnpm chưa được cài đặt. Đang tiến hành cài đặt pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        color 0C
        echo [LỖI] Không thể cài đặt pnpm! Vui lòng mở Command Prompt quyền Admin để cài đặt.
        pause
        exit /b 1
    )
    echo [OK] Đã cài đặt pnpm thành công.
    echo.
)

echo [INFO] Phiên bản pnpm hiện tại:
pnpm -v
echo.

:: Xoá node_modules cũ nếu có
if exist "node_modules" (
    echo [INFO] Đang xoá thư mục node_modules cũ...
    rmdir /s /q node_modules
    echo [OK] Đã xoá node_modules cũ.
    echo.
)

:: Cài đặt thư viện bằng pnpm
echo [INFO] Đang cài đặt các thư viện dự án (pnpm install)...
echo Quá trình này có thể mất một vài phút...
echo.
pnpm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [LỖI] Cài đặt thư viện thất bại!
    echo Vui lòng kiểm tra kết nối mạng và thử lại.
    echo.
    pause
    exit /b 1
)

:: Tạo file .env từ .env.example nếu chưa tồn tại
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Tạo file cấu hình .env từ .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] Đã tạo file .env thành công.
    )
)

echo.
echo ============================================
echo   [THÀNH CÔNG] Đã hoàn thành cài đặt!
echo ============================================
echo.
echo Để khởi chạy máy chủ phát triển, hãy chạy file: run-dev.bat
echo.
pause
