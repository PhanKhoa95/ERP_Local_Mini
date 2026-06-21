@echo off
setlocal

cd /d "%~dp0"

echo ========================================
echo Multi Sale Organizer - Local Dev Server
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or is not in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or is not in PATH.
  echo Install Node.js with npm, then run this file again.
  pause
  exit /b 1
)

if not exist ".env" (
  echo [INFO] .env was not found. Creating it from .env.example...
  copy ".env.example" ".env" >nul
  echo [WARN] Fill Supabase and AI values in .env if login, data loading, or AI fails.
  echo.
)

call :ensureEnvKey "OPENROUTER_API_KEY" ""
call :ensureEnvKey "OPENROUTER_MODEL" "google/gemini-2.5-flash"
call :ensureEnvKey "OPENROUTER_BASE_URL" "https://openrouter.ai/api/v1"
call :ensureEnvKey "OPENROUTER_SITE_URL" "http://127.0.0.1:8017"
call :ensureEnvKey "OPENROUTER_APP_TITLE" "Multi Sale Organizer"
call :ensureEnvKey "LOVABLE_API_KEY" ""

call :loadEnvValue "OPENROUTER_API_KEY"
call :loadEnvValue "OPENROUTER_MODEL"

if defined OPENROUTER_API_KEY (
  echo [AI] OpenRouter enabled. Model: %OPENROUTER_MODEL%
) else (
  echo [AI] OpenRouter key is empty. AI Edge Functions will use Lovable fallback if configured.
  echo [AI] Add OPENROUTER_API_KEY to .env, then run this file again.
)
echo.

if not exist "node_modules\vite\" (
  echo [INFO] node_modules was not found. Installing dependencies...
  call pnpm install

  if errorlevel 1 (
    echo.
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )

  echo.
)

echo Starting app...
echo To access from another device on the same Wi-Fi/LAN, use this computer's IP address.
echo Press Ctrl+C to stop the server.
echo.

call pnpm run dev -- --host 0.0.0.0 --port 8017

if errorlevel 1 (
  echo.
  echo [ERROR] App stopped with an error.
  pause
  exit /b 1
)

endlocal
exit /b 0

:ensureEnvKey
set "ENV_KEY=%~1"
set "ENV_DEFAULT=%~2"
findstr /b /c:"%ENV_KEY%=" ".env" >nul 2>nul
if errorlevel 1 (
  >> ".env" echo %ENV_KEY%=%ENV_DEFAULT%
  echo [INFO] Added %ENV_KEY% to .env
)
exit /b 0

:loadEnvValue
set "ENV_KEY=%~1"
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"%ENV_KEY%=" ".env"`) do (
  set "%ENV_KEY%=%%B"
)
exit /b 0
