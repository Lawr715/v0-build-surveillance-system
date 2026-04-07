#!/bin/bash
set -e
source .venv/bin/activate

echo "============================================"
echo "  ALIVE Engine — Starting"
echo "============================================"
echo "  Backend  → http://localhost:8000"
echo "  Frontend → http://localhost:3000"
echo "  Press Ctrl+C to stop both."
echo ""

uvicorn backend.app.main:app --reload --port 8000 &
BACKEND_PID=$!

npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
