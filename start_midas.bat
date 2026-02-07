@echo off
echo ==========================================
echo       STARTING MIDAS SYSTEM
echo ==========================================

:: Start Backend
echo [1/2] Launching Backend Server...
start "MIDAS Backend" cmd /k "venv\Scripts\activate && python ml/server.py"

:: Start Frontend
echo [2/2] Launching Frontend Server...
cd frontend
start "MIDAS Frontend" cmd /k "npm run dev"

echo ==========================================
echo       SYSTEM ONLINE
echo ==========================================
echo Backend: http://0.0.0.0:8000
echo Frontend: https://localhost:5173 (Network: https://10.218.15.240:5173)
echo.
pause
