@echo off
echo === Costos Lomas - Dev Environment ===
echo.

echo [1/3] Starting PostgreSQL via WSL...
wsl -d Ubuntu -u root -- bash -c "service postgresql start" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: WSL no esta disponible. Verifica que WSL este instalado.
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for PostgreSQL to be ready...
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Starting Next.js dev server...
npm run dev
