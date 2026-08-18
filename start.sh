#!/usr/bin/env bash

echo "==================================================="
echo "  Starting CrimeGPT Platform (Backend + Frontend)"
echo "==================================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Start Backend
echo "Starting Backend Server on http://localhost:8000 ..."
(
  cd apps/backend
  if [ -d "venv" ]; then
    source venv/bin/activate
  fi
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) &
BACKEND_PID=$!

sleep 2

# Start Frontend
echo "Starting Frontend Dev Server on http://localhost:3000 ..."
(
  cd apps/frontend
  npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "==================================================="
echo "  CrimeGPT is running!"
echo "  - Web UI:       http://localhost:3000"
echo "  - Backend API:  http://localhost:8000"
echo "  - Swagger Docs: http://localhost:8000/docs"
echo "  Press [CTRL+C] to stop all services."
echo "==================================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
