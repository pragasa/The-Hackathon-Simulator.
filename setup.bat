@echo off
REM Quick Start Script for The Hackathon Simulator Monorepo

echo.
echo ====================================
echo  THE HACKATHON SIMULATOR - Setup
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed
    pause
    exit /b 1
)

echo.
echo [2/4] Copying frontend environment template...
if not exist .env.local (
    copy .env.example .env.local >nul
    echo HINT: Update frontend/.env.local with your API configuration
)

echo.
echo [3/4] Installing backend dependencies...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed
    pause
    exit /b 1
)

echo.
echo [4/4] Copying backend environment template...
if not exist .env.local (
    copy .env.example .env.local >nul
    echo HINT: Update backend/.env.local with your API keys
)

echo.
echo ====================================
echo  ✓ Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Update environment variables:
echo    - frontend/.env.local
echo    - backend/.env.local
echo.
echo 2. Start development (open 2 terminals):
echo    Terminal 1: cd frontend ^& npm run dev
echo    Terminal 2: cd backend ^& npm run dev
echo.
echo 3. Open http://localhost:3000 in your browser
echo.
echo For more information, see MONOREPO_GUIDE.md
echo.
pause
