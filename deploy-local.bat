@echo off
REM Wick Wax Relax - Local Deployment Script (Windows)
REM This script sets up and runs the application locally for testing

echo 🚀 Starting Wick Wax Relax Local Deployment
echo ==========================================

REM Set environment variables
set NODE_ENV=development
set FRONTEND_PORT=3000
set JWT_SECRET=local_development_jwt_secret_key_change_in_production
set JWT_REFRESH_SECRET=local_development_refresh_secret_key_change_in_production
set FRONTEND_URL=http://localhost:%FRONTEND_PORT%

REM Redis URL is configured in .env file - do not override

echo [INFO] Environment variables set for local development

REM Backend setup
echo [INFO] Setting up backend...
cd backend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    call npm install
    echo [SUCCESS] Backend dependencies installed
) else (
    echo [INFO] Backend dependencies already installed
)

REM Start backend server
echo [INFO] Starting backend server on port 3003...
start /B set PORT=3003 && npm run dev

REM Wait for backend to start
echo [INFO] Waiting for backend server to start...
timeout /t 5 /nobreak > nul

REM Check if backend is running
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:3003/api/health' -Method GET; if ($response.StatusCode -eq 200) { Write-Host '[SUCCESS] Backend server is running on http://localhost:3003' -ForegroundColor Green } } catch { Write-Host '[ERROR] Backend server failed to start' -ForegroundColor Red; exit 1 } }" 2>nul

REM Frontend setup
echo [INFO] Setting up frontend...
cd ../frontend

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    echo [SUCCESS] Frontend dependencies installed
) else (
    echo [INFO] Frontend dependencies already installed
)

REM Start frontend development server
echo [INFO] Starting frontend development server on port %FRONTEND_PORT%...
start /B npm run dev

REM Wait for frontend to start
echo [INFO] Waiting for frontend server to start...
timeout /t 10 /nobreak > nul

REM Check if frontend is running
powershell -Command "& {try { $response = Invoke-WebRequest -Uri 'http://localhost:%FRONTEND_PORT%' -Method GET; if ($response.StatusCode -eq 200) { Write-Host '[SUCCESS] Frontend server is running on http://localhost:%FRONTEND_PORT%' -ForegroundColor Green } } catch { Write-Host '[WARNING] Frontend server may still be starting...' -ForegroundColor Yellow } }" 2>nul

echo.
echo 🎉 Wick Wax Relax is now running locally!
echo.
echo 🌐 Frontend: http://localhost:%FRONTEND_PORT%
echo 🔧 Backend API: http://localhost:3003
echo 📊 API Health Check: http://localhost:3003/api/health
echo.
echo [INFO] Press Ctrl+C in the terminal windows to stop the servers
echo [INFO] Or close the command prompt windows that opened

pause