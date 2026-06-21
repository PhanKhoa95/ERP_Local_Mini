#!/bin/bash

# Di chuyển đến thư mục của script
cd "$(dirname "$0")"

echo "========================================"
echo "Multi Sale Organizer - Local Dev Server"
echo "========================================"
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or is not in PATH."
    echo "Install Node.js, then run this file again."
    read -p "Press Enter to exit..."
    exit 1
fi

# Kiểm tra npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed or is not in PATH."
    echo "Install Node.js with npm, then run this file again."
    read -p "Press Enter to exit..."
    exit 1
fi

# Khởi tạo file .env nếu chưa tồn tại
if [ ! -f ".env" ]; then
    echo "[INFO] .env was not found. Creating it from .env.example..."
    cp .env.example .env
    echo "[WARN] Fill Supabase and AI values in .env if login, data loading, or AI fails."
    echo ""
fi

# Hàm chèn khoá cấu hình mặc định vào .env nếu thiếu
ensure_env_key() {
    local key="$1"
    local default_value="$2"
    if ! grep -q "^${key}=" .env; then
        echo "${key}=${default_value}" >> .env
        echo "[INFO] Added ${key} to .env"
    fi
}

ensure_env_key "OPENROUTER_API_KEY" ""
ensure_env_key "OPENROUTER_MODEL" "google/gemini-2.5-flash"
ensure_env_key "OPENROUTER_BASE_URL" "https://openrouter.ai/api/v1"
ensure_env_key "OPENROUTER_SITE_URL" "http://127.0.0.1:8017"
ensure_env_key "OPENROUTER_APP_TITLE" "Multi Sale Organizer"
ensure_env_key "LOVABLE_API_KEY" ""

# Đọc giá trị cấu hình AI
OPENROUTER_API_KEY=$(grep "^OPENROUTER_API_KEY=" .env | cut -d'=' -f2-)
OPENROUTER_MODEL=$(grep "^OPENROUTER_MODEL=" .env | cut -d'=' -f2-)

if [ -n "$OPENROUTER_API_KEY" ]; then
    echo "[AI] OpenRouter enabled. Model: $OPENROUTER_MODEL"
else
    echo "[AI] OpenRouter key is empty. AI Edge Functions will use Lovable fallback if configured."
    echo "[AI] Add OPENROUTER_API_KEY to .env, then run this file again."
fi
echo ""

# Cài đặt thư viện phụ thuộc nếu chưa có node_modules
if [ ! -d "node_modules" ]; then
    echo "[INFO] node_modules was not found. Installing dependencies..."
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        pnpm install
    fi

    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Dependency installation failed."
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
fi

echo "Starting app at http://127.0.0.1:8017/"
echo "Press Ctrl+C to stop the server."
echo ""

npm run dev -- --host 127.0.0.1 --port 8017
