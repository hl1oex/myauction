@echo off
chcp 65001 >nul
cd /d "%~dp0"
title AI_Real_Estate_System_v1.0

echo [+] Activating virtual environment...
call "..\.venv\Scripts\activate.bat"

echo [+] Checking required libraries...
"..\.venv\Scripts\python.exe" -c "import fastapi, uvicorn, apscheduler, requests, bs4" >nul 2>&1
if errorlevel 1 (
    echo [⚠️] Installing missing packages...
    "..\.venv\Scripts\python.exe" -m pip install fastapi uvicorn apscheduler requests beautifulsoup4 pandas openpyxl
)

echo [+] Starting FastAPI API Server on http://127.0.0.1:8000
echo [+] Launching client dashboard in Google Chrome...
start /b cmd /c "ping 127.0.0.1 -n 4 >nul && start chrome http://127.0.0.1:8000"
"..\.venv\Scripts\python.exe" main.py
pause
