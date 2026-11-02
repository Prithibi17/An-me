@echo off
title An:me Uninstall
cd /d "%~dp0"
start "" "%~dp0dist-setup\An-me Setup-win32-x64\An-me Setup.exe" --uninstall
