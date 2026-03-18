@echo off
REM Auto-start PostgreSQL in WSL - add to Windows Startup folder or Task Scheduler
wsl -d Ubuntu -u root -- bash -c "service postgresql start" 2>nul >nul
