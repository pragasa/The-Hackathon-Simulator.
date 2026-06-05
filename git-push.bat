@echo off
REM GitHub Push Script - Push changes to remote repository

echo.
echo ====================================
echo  Pushing to GitHub
echo ====================================
echo.

REM Check if in correct directory
if not exist package.json (
    echo ERROR: This script must be run from hackathonproject root directory
    pause
    exit /b 1
)

echo Checking remote configuration...
git remote -v

echo.
echo Pushing to main branch...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo  ✓ Push Successful!
    echo ====================================
    echo.
    echo Your code is now on GitHub!
    echo You can now deploy to Vercel and Render.
    echo.
) else (
    echo.
    echo ERROR: Push failed
    echo Please check:
    echo 1. Repository exists on GitHub
    echo 2. GitHub username is correct
    echo 3. You have proper authentication
    echo.
)

pause
