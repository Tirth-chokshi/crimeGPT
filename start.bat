@echo off
title CrimeGPT - Launch Services
echo ===================================================
echo   Starting CrimeGPT Platform (Backend + Frontend)
echo ===================================================
echo.

cd /d "%~dp0"

echo Starting Backend Server on http://localhost:8000 ...
start "CrimeGPT Backend" cmd /k "cd apps\backend && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && python -m uvicorn main:app --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server on http://localhost:3000 ...
start "CrimeGPT Frontend" cmd /k "cd apps\frontend && npm run dev"

echo.
echo ===================================================
echo   CrimeGPT is running!
echo   - Web UI:       http://localhost:3000
echo   - Backend API:  http://localhost:8000
echo   - Swagger Docs: http://localhost:8000/docs
echo ===================================================
