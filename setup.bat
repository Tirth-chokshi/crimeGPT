@echo off
title CrimeGPT - Automated Installation & Setup
echo ===================================================
echo   CrimeGPT - AI Legal Automation Platform Setup
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/4] Setting up Python backend virtual environment...
cd apps\backend
if not exist "venv" (
    python -m venv venv
    echo   Created new Python virtual environment in apps\backend\venv
)
call venv\Scripts\activate.bat

echo [2/4] Installing backend dependencies...
pip install -r requirements.txt
if not exist ".env" (
    copy .env.example .env
    echo   Created default .env from .env.example
)

echo [3/4] Initializing CrimeGPT database and seeding sample cases...
python seed_data.py

echo [4/4] Installing frontend dependencies...
cd ..\frontend
call npm install

echo.
echo ===================================================
echo   Setup Complete!
echo   Run start.bat to launch both Backend and Frontend.
echo ===================================================
pause
