@echo off
title An:me Desktop
cd /d "C:\Users\HERMIT-PRITHIBI\.gemini\antigravity\scratch\an-me-desktop"
echo ========================================================
echo             Starting An:me Desktop Client
echo ========================================================
echo.

echo Building application...
call npm run build

call npx electron .
