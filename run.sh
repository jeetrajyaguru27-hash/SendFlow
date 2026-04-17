#!/bin/bash

# Email Automation Startup Script
set -u

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/sendflow-pro-main"
LOG_DIR="$ROOT_DIR/.logs"

mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PID=""
FRONTEND_PID=""
SHUTTING_DOWN=0

echo "🚀 Starting Email Automation Platform..."

if [ ! -d "$ROOT_DIR/venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv "$ROOT_DIR/venv"
fi

echo "🔧 Activating virtual environment..."
source "$ROOT_DIR/venv/bin/activate"

echo "📥 Installing Python dependencies..."
pip3 install -r "$ROOT_DIR/requirements.txt"

echo "🧹 Cleaning up old local app processes..."
pkill -f "streamlit run .*frontend/app.py" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "sendflow-pro-main" 2>/dev/null || true
pkill -f "python3 -m uvicorn app.main:app" 2>/dev/null || true

echo "📝 Resetting service logs..."
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"

mkdir -p "$ROOT_DIR/database"

if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
    echo "✏️  Please edit .env file with your Google OAuth credentials!"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📥 Installing React frontend dependencies..."
    (cd "$FRONTEND_DIR" && npm install)
fi

stop_service() {
    local pid="$1"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
        wait "$pid" 2>/dev/null || true
    fi
}

cleanup() {
    if [ "$SHUTTING_DOWN" -eq 1 ]; then
        return
    fi
    SHUTTING_DOWN=1
    echo ""
    echo "🛑 Shutting down services..."
    stop_service "$BACKEND_PID"
    stop_service "$FRONTEND_PID"
}

trap cleanup INT TERM EXIT

start_backend() {
    echo "🔄 Starting FastAPI backend..."
    (
        cd "$BACKEND_DIR" &&
        python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    ) >>"$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo "📊 Backend PID: $BACKEND_PID"
}

start_frontend() {
    echo "🔄 Starting React frontend..."
    (
        cd "$FRONTEND_DIR" &&
        npm run dev -- --host 127.0.0.1 --port 8081
    ) >>"$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo "🖥️  Frontend PID: $FRONTEND_PID"
}

restart_if_needed() {
    local name="$1"
    local pid="$2"
    local start_fn="$3"

    if ! kill -0 "$pid" 2>/dev/null; then
        echo "⚠️  $name stopped unexpectedly. Restarting..."
        "$start_fn"
    fi
}

echo ""
echo "🎯 Starting services..."
echo "Backend API: http://localhost:8000"
echo "Frontend UI: http://localhost:8081"
echo "API Docs: http://localhost:8000/docs"
echo "Logs: $LOG_DIR"
echo ""

start_backend
sleep 2
start_frontend

echo ""
echo "✅ Services started successfully!"
echo "💡 Press Ctrl+C once to stop all services"
echo ""

while true; do
    if [ "$SHUTTING_DOWN" -eq 1 ]; then
        break
    fi

    restart_if_needed "Backend" "$BACKEND_PID" start_backend
    restart_if_needed "Frontend" "$FRONTEND_PID" start_frontend
    sleep 3
done
