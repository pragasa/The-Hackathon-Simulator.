@echo off
REM GitHub Configuration Script for The Hackathon Simulator

echo.
echo ====================================
echo  GitHub Configuration Setup
echo ====================================
echo.

echo This script will help you:
echo 1. Remove the old remote (udaysharmadev)
echo 2. Add your new GitHub repository
echo 3. Push your changes
echo.

REM Check if in correct directory
if not exist package.json (
    echo ERROR: This script must be run from hackathonproject root directory
    pause
    exit /b 1
)

REM Get GitHub username
set /p GITHUB_USERNAME="Enter your GitHub username: "

if "%GITHUB_USERNAME%"=="" (
    echo ERROR: GitHub username cannot be empty
    pause
    exit /b 1
)

REM Get repository name
set /p REPO_NAME="Enter your repository name (default: The-Hackathon-Simulator): "
if "%REPO_NAME%"=="" (
    set REPO_NAME=The-Hackathon-Simulator
)

echo.
echo ====================================
echo  Updating Git Configuration
echo ====================================
echo.

echo [1/5] Removing old remote origin...
git remote remove origin
if %errorlevel% neq 0 (
    echo WARNING: No existing remote to remove, continuing...
)

echo [2/5] Adding new remote...
set NEW_URL=https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git
git remote add origin %NEW_URL%
if %errorlevel% neq 0 (
    echo ERROR: Failed to add remote
    pause
    exit /b 1
)

echo [3/5] Setting main branch...
git branch -M main
if %errorlevel% neq 0 (
    echo ERROR: Failed to set branch
    pause
    exit /b 1
)

echo [4/5] Staging changes...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Failed to stage changes
    pause
    exit /b 1
)

echo [5/5] Committing changes...
git commit -m "Organize frontend and backend with monorepo structure - ready for Vercel and Render deployment"
if %errorlevel% neq 0 (
    echo WARNING: Nothing to commit (changes already committed)
)

echo.
echo ====================================
echo  Ready to Push!
echo ====================================
echo.
echo New Repository URL:
echo %NEW_URL%
echo.
echo Next, you need to:
echo 1. Create the repository on GitHub at https://github.com/new
echo    - Repository name: %REPO_NAME%
echo    - Make it PUBLIC
echo    - Do NOT initialize with README
echo.
echo 2. Then run this command to push:
echo    git push -u origin main
echo.
echo Or run: push.bat (once you've created the repo)
echo.
pause
