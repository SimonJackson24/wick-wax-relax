@echo off
echo Starting Wick Wax & Relax Application Servers...
echo This will start both the frontend and backend servers.
echo.

echo Starting backend server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting frontend server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Servers are starting up...
echo Frontend will be available at: http://localhost:3000
echo Backend will be available at: http://localhost:5000
echo.
echo Close this window to stop the servers.
echo Note: You'll need to manually close the server windows that opened.
pause