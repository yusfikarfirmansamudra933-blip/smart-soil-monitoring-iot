@echo off
title Antigravity CLI (agy) - Smart Soil Monitoring IoT
cd /d "%~dp0"
set "PATH=%LOCALAPPDATA%\agy\bin;%USERPROFILE%\.gemini\antigravity\bin;%LOCALAPPDATA%\Programs\antigravity;%PATH%"
echo ============================================================================
echo   SMART SOIL MONITORING IoT - ANTIGRAVITY CLI TERMINAL
echo   Workspace: %CD%
echo ============================================================================
if exist "%LOCALAPPDATA%\agy\bin\agy.exe" (
    "%LOCALAPPDATA%\agy\bin\agy.exe" %*
) else (
    echo Menjalankan instalasi Antigravity CLI ^(agy^)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://antigravity.google/cli/install.ps1 | iex"
    if exist "%LOCALAPPDATA%\agy\bin\agy.exe" (
        "%LOCALAPPDATA%\agy\bin\agy.exe" %*
    ) else (
        cmd /k
    )
)
