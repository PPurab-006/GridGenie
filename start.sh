#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "======================================================================"
echo "⚡ Starting GridMind: Autonomous Microgrid Optimizer (IEEE ClimateChain)"
echo "======================================================================"

# Ensure virtual environment exists
if [ ! -d ".venv" ]; then
  echo "Virtual environment .venv not found. Creating..."
  uv venv --python 3.11 .venv
  uv pip install fastapi uvicorn pydantic numpy scipy scikit-learn pytest httpx --python .venv/bin/python
fi

# Function to kill all spawned child processes on exit
cleanup() {
  echo ""
  echo "Shutting down GridMind backend and frontend services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Start backend
echo "▶ Starting FastAPI backend on http://127.0.0.1:8008 (Docs: /docs)..."
PYTHONPATH="$ROOT_DIR/backend" .venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8008 &
BACKEND_PID=$!

# Wait for backend health
echo "Checking backend health..."
for i in {1..30}; do
  if curl -s http://127.0.0.1:8008/api/health >/dev/null 2>&1; then
    echo "✓ Backend is healthy and ready!"
    break
  fi
  sleep 0.5
done

# Start frontend
echo "▶ Starting Vite React dashboard on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "🚀 GridMind is LIVE!"
echo "   Dashboard: http://localhost:5173"
echo "   API Docs:  http://127.0.0.1:8008/docs"
echo "   Press Ctrl+C to terminate all services."
echo "======================================================================"

# Wait for background processes
wait
