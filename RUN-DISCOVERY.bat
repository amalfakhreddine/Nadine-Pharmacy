@echo off
set SCRIPT=%~dp0discover-softpharm.ps1
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
