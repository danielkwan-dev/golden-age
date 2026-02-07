@echo off
echo ==========================================
echo       STARTING MIDAS SYSTEM
echo ==========================================

:: Start Backend (which also serves Frontend)
echo [1/2] Launching Unified Server...
start "MIDAS Unified Server" cmd /k "venv\Scripts\activate && python ml/server.py"

:: Start Ngrok Tunnel
echo [2/2] Launching Ngrok Tunnel...
echo.
echo Check the NEW window for your public URL (starts with https://...)
echo This ONE URL will now work for both the API and the Website.
echo.
start "MIDAS Tunnel" cmd /k "ngrok http 8000"

echo ==========================================
echo       SYSTEM ONLINE
echo ==========================================
echo Unified Server: http://localhost:8000
echo.
pause
