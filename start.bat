@echo off
title AI Civilization Economic Simulator Startup
echo ===================================================
echo     AI CIVILIZATION ECONOMIC SIMULATOR STARTUP
echo ===================================================
echo.
cd /d "%~dp0"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [Error] Node.js is not installed or not in PATH.
    echo Please install Node.js to start the project.
    echo.
    pause
    exit /b 1
)

node start.js
if %ERRORLEVEL% neq 0 (
    echo.
    echo [Startup] Startup failed. Press any key to exit...
    pause >nul
)
