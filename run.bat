@echo off
chcp 65001 >nul
title Multi Sale Organizer - Trình Quản Lý & Khởi Chạy Dự Án
color 0F

cd /d "%~dp0"

:: Kiểm tra Node.js trước khi bắt đầu
where node >nul 2>nul
if errorlevel 1 (
    color 0C
    echo [LỖI] Node.js chưa được cài đặt hoặc chưa được thêm vào biến môi trường PATH!
    echo Vui lòng tải và cài đặt Node.js từ https://nodejs.org/ trước khi tiếp tục.
    echo.
    pause
    exit /b 1
)

:MENU
cls
echo ========================================================
echo   Multi Sale Organizer - TRÌNH QUẢN LÝ KHỞI CHẠY DỰ ÁN
echo ========================================================
echo.
echo   [1] Khởi chạy máy chủ phát triển (Vite Dev Server)
echo   [2] Cài đặt / Cập nhật thư viện (Setup / Install Dependencies)
echo   [3] Chạy Unit & Integration Tests (Vitest)
echo   [4] Chạy End-to-End Tests (Playwright)
echo   [5] Kiểm tra chất lượng toàn bộ dự án (Typecheck, Lint, Test & Build)
echo   [6] Thoát (Exit)
echo.
echo ========================================================
set /p opt="Vui lòng chọn một chức năng (1-6): "

if "%opt%"=="1" goto DEV
if "%opt%"=="2" goto INSTALL
if "%opt%"=="3" goto TEST_UNIT
if "%opt%"=="4" goto TEST_E2E
if "%opt%"=="5" goto CHECK_ALL
if "%opt%"=="6" goto EXIT
goto MENU

:DEV
cls
echo ========================================================
echo   Khởi chạy máy chủ phát triển...
echo ========================================================
echo.

:: Kiểm tra node_modules
if not exist "node_modules\" (
    echo [CẢNH BÁO] Thư mục node_modules chưa tồn tại.
    echo Đang tự động tiến hành cài đặt thư viện trước...
    echo.
    goto INSTALL_SILENT
)

:DEV_RUN
:: Kiểm tra và khởi tạo .env
call :CHECK_ENV

echo [INFO] Đang khởi động Cloudflare Tunnel ở cửa sổ mới...
start "Cloudflare Tunnel" cmd /c npx cloudflared tunnel --url http://localhost:8017

echo [INFO] Khởi động máy chủ Vite (port 8017)...
echo.
call npx pnpm run dev -- --host 0.0.0.0 --port 8017
if errorlevel 1 (
    echo.
    echo [LỖI] Máy chủ dev dừng đột ngột hoặc có lỗi xảy ra.
    pause
)
goto MENU

:INSTALL
cls
echo ========================================================
echo   Cài đặt / Cập nhật thư viện dự án
echo ========================================================
echo.
set "CI=true"
where pnpm >nul 2>nul
if errorlevel 1 (
    echo [INFO] pnpm chưa được cài đặt. Đang cài đặt pnpm toàn cục...
    call npm install -g pnpm
    if errorlevel 1 (
        echo [CẢNH BÁO] Cài đặt pnpm thất bại. Đang cố gắng cài đặt bằng npm...
        call npm install
        goto INSTALL_DONE
    )
)
echo [INFO] Đang tiến hành cài đặt thư viện qua pnpm...
call pnpm install
:INSTALL_DONE
if errorlevel 0 (
    echo.
    echo ✅ Cài đặt thư viện thành công!
) else (
    echo.
    echo ❌ Cài đặt thư viện thất bại!
)
pause
goto MENU

:INSTALL_SILENT
set "CI=true"
where pnpm >nul 2>nul
if errorlevel 1 (
    call npm install -g pnpm
    if errorlevel 1 (
        call npm install
        goto DEV_RUN
    )
)
call pnpm install
goto DEV_RUN

:TEST_UNIT
cls
echo ========================================================
echo   Chạy Unit & Integration Tests (Vitest)
echo ========================================================
echo.
call npx vitest run
echo.
pause
goto MENU

:TEST_E2E
cls
echo ========================================================
echo   Chạy End-to-End Tests (Playwright)
echo ========================================================
echo.
call npx playwright test
echo.
pause
goto MENU

:CHECK_ALL
cls
echo ========================================================
echo   Kiểm tra chất lượng toàn bộ dự án
echo ========================================================
echo.
echo [1/4] Đang kiểm tra kiểu dữ liệu TypeScript (Typecheck)...
call npm run typecheck
if errorlevel 1 (
    echo ❌ Lỗi kiểm tra kiểu!
) else (
    echo ✅ Đạt kiểm tra kiểu.
)
echo.

echo [2/4] Đang quét lỗi cú pháp và style (Lint)...
call npm run lint
echo.

echo [3/4] Đang chạy kiểm thử unit (Vitest)...
call npx vitest run
echo.

echo [4/4] Đang kiểm tra biên dịch tối ưu (Production Build)...
call npm run build
echo.
pause
goto MENU

:CHECK_ENV
if not exist ".env" (
  echo [INFO] Không tìm thấy file .env. Đang sao chép từ .env.example...
  copy ".env.example" ".env" >nul
)

call :ensureEnvKey "OPENROUTER_API_KEY" ""
call :ensureEnvKey "OPENROUTER_MODEL" "google/gemini-2.5-flash"
call :ensureEnvKey "OPENROUTER_BASE_URL" "https://openrouter.ai/api/v1"
call :ensureEnvKey "OPENROUTER_SITE_URL" "http://127.0.0.1:8017"
call :ensureEnvKey "OPENROUTER_APP_TITLE" "Multi Sale Organizer"
call :ensureEnvKey "LOVABLE_API_KEY" ""
exit /b 0

:ensureEnvKey
set "ENV_KEY=%~1"
set "ENV_DEFAULT=%~2"
findstr /b /c:"%ENV_KEY%=" ".env" >nul 2>nul
if errorlevel 1 (
  >> ".env" echo %ENV_KEY%=%ENV_DEFAULT%
  echo [INFO] Đã thêm %ENV_KEY% vào file .env
)
exit /b 0

:EXIT
echo.
echo Cảm ơn bạn đã sử dụng hệ thống! Hẹn gặp lại.
echo.
exit /b 0
