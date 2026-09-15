@echo off
setlocal EnableDelayedExpansion

REM Run from repo root: double-click or `start-local.bat`
cd /d "%~dp0"

set "FRONTEND_PORT=5173"
set "BACKEND_PORT=8000"
set "FRONTEND_ORIGIN=http://localhost:%FRONTEND_PORT%"
set "BACKEND_URL=http://localhost:%BACKEND_PORT%"

echo.
echo ========================================
echo   UP Circuit Portal - Local Dev Starter
echo ========================================
echo.

if not exist "backend\.env" (
  echo [ERROR] backend\.env is missing.
  echo         Copy backend\.env.example to backend\.env and set your passwords.
  goto :fail
)

if not exist "backend\.venv\Scripts\python.exe" (
  echo [ERROR] backend\.venv is missing.
  echo         Run once:
  echo           cd backend
  echo           python -m venv .venv
  echo           .venv\Scripts\activate
  echo           pip install -r requirements.txt
  goto :fail
)

if not exist "frontend\.env" (
  echo [INFO] Creating frontend\.env from frontend\.env.example ...
  copy /Y "frontend\.env.example" "frontend\.env" >nul
)

if not exist "frontend\node_modules" (
  echo [INFO] Installing frontend dependencies ...
  pushd frontend
  call npm install
  if errorlevel 1 goto :fail
  popd
)

findstr /C:"FRONTEND_ORIGIN=%FRONTEND_ORIGIN%" "backend\.env" >nul 2>&1
if errorlevel 1 (
  echo [WARN] backend\.env should include this exact line:
  echo         FRONTEND_ORIGIN=%FRONTEND_ORIGIN%
  echo         Without it, login will fail with CORS / CSRF errors.
  echo.
)

findstr /C:"VITE_API_BASE_URL=%BACKEND_URL%" "frontend\.env" >nul 2>&1
if errorlevel 1 (
  echo [WARN] frontend\.env should include:
  echo         VITE_API_BASE_URL=%BACKEND_URL%
  echo.
)

echo [INFO] Applying database migrations ...
pushd backend
call .venv\Scripts\python.exe -m alembic upgrade head
set MIGRATE_EXIT=%ERRORLEVEL%
popd
if not "%MIGRATE_EXIT%"=="0" (
  echo [ERROR] Alembic migration failed. Check DATABASE_URL / MIGRATOR_DATABASE_URL in backend\.env
  goto :fail
)

echo [INFO] Syncing demo users from DEV_SEED_PASSWORD in backend\.env ...
pushd backend
call .venv\Scripts\python.exe ..\scripts\seed_m1_users.py
set SEED_EXIT=%ERRORLEVEL%
popd
if not "%SEED_EXIT%"=="0" (
  echo [ERROR] Seed failed. Ensure DEV_SEED_PASSWORD is in backend\.env ^(12+ chars^).
  goto :fail
)

echo [INFO] Optional: seed verified Circuit content with:
echo         python scripts\seed_verified_content.py
echo         ^(Demo fake URLs are NOT auto-seeded — see scripts\seed_demo_content.py^)

echo [INFO] Stopping anything already listening on ports %BACKEND_PORT% and %FRONTEND_PORT% ...
powershell -NoProfile -File "%~dp0scripts\stop-local.ps1" -BackendPort %BACKEND_PORT% -FrontendPort %FRONTEND_PORT% -RepoRoot "%~dp0"
if errorlevel 1 (
  echo [ERROR] Could not free ports %BACKEND_PORT% / %FRONTEND_PORT%. Run stop-local.bat and close server windows.
  goto :fail
)

echo [INFO] Starting backend  -^> %BACKEND_URL%
start "UP Circuit Backend" cmd /k "cd /d "%~dp0backend" && call .venv\Scripts\activate.bat && set PYTHONUNBUFFERED=1 && echo. && echo SERVER LOG - do not type here. && echo Do NOT start uvicorn again in another window. && echo After Continue on http://localhost:%FRONTEND_PORT%/login look for: && echo   [OTP] login code for ... && echo If you see POST /auth/login 401 instead, re-run start-local.bat. && echo. && python -m uvicorn app.main:app --host 127.0.0.1 --port %BACKEND_PORT% --log-level info"

echo [INFO] Waiting for backend health check ...
set "TRIES=0"
:wait_health
ping -n 2 127.0.0.1 >nul
set /a TRIES+=1
powershell -NoProfile -Command "try { exit [int]((Invoke-WebRequest -Uri '%BACKEND_URL%/api/v1/health' -UseBasicParsing).StatusCode -ne 200) } catch { exit 1 }" >nul 2>&1
if errorlevel 1 (
  if !TRIES! lss 20 goto wait_health
  echo [WARN] Backend did not respond in time. Check the Backend window for errors.
) else (
  echo [OK] Backend is healthy.
)

echo [INFO] Starting frontend -^> http://localhost:%FRONTEND_PORT%/
start "UP Circuit Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

ping -n 4 127.0.0.1 >nul
start "" "http://localhost:%FRONTEND_PORT%/"

echo.
echo ========================================
echo   Ready
echo ========================================
echo   App:  http://localhost:%FRONTEND_PORT%/
echo   API:  %BACKEND_URL%/api/v1/health
echo   Docs: %BACKEND_URL%/api/docs
echo.
echo   Demo login emails:
echo     renewed.member@up.edu.ph
echo     notrenewed.member@up.edu.ph
echo     academic.admin@up.edu.ph
echo     renewals.admin@up.edu.ph
echo     super.admin@up.edu.ph
echo   Password: your DEV_SEED_PASSWORD in backend\.env
echo   OTP:        Backend window ^(not the browser^)
echo.
echo   Stop: close both server windows, or run stop-local.bat
echo ========================================
echo.
pause
exit /b 0

:fail
echo.
pause
exit /b 1
