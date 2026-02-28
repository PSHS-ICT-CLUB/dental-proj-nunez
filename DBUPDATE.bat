@echo off
setlocal

REM ============================================
REM  Database Update & Environment Sync Script
REM  for Nunez Dental Laboratory
REM ============================================

REM JSONBin.io Configuration (set as environment variables for PowerShell)
set JSONBIN_URL=https://api.jsonbin.io/v3/b/6945096d43b1c97be9f89f61/latest
set JSONBIN_API_KEY=$2a$10$C2jpz3zStAUGHXfRbHcLHewsM5IgGIaS/KbcArYIW1rxHJ0DgrZPG

REM Database connection settings
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=dental
set PGUSER=postgres
set PGPASSWORD=rosislife143

echo ============================================
echo   Dental Lab Database Update Script
echo ============================================
echo.

echo [1/3] Running database updates...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f updatedb.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to run SQL script
    pause
    exit /b 1
)

echo.
echo [2/3] Syncing environment variables from JSONBin.io...

REM Delete old .env
if exist .env del .env

REM Run the external PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\fetch_env.ps1"

echo.
echo [3/3] Reloading PM2 instances...

pm2 reload ecosystem.config.js --update-env 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo   - PM2 not running, starting fresh...
    pm2 start ecosystem.config.js
)
echo   - PM2 instances reloaded

echo.
echo ============================================
echo   Update Complete!
echo ============================================
echo.
pause