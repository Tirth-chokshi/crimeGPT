#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  CrimeGPT - AI Legal Automation Platform Setup"
echo "==================================================="
echo ""

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "[1/4] Setting up Python backend virtual environment..."
cd apps/backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "  Created new Python virtual environment in apps/backend/venv"
fi
source venv/bin/activate

echo "[2/4] Installing backend dependencies..."
pip install -r requirements.txt
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "  Created default .env from .env.example"
fi

echo "[3/4] Initializing CrimeGPT database and seeding sample cases..."
python seed_data.py

echo "[4/4] Installing frontend dependencies..."
cd ../frontend
npm install

echo ""
echo "==================================================="
echo "  Setup Complete!"
echo "  Run ./start.sh to launch both Backend and Frontend."
echo "==================================================="
