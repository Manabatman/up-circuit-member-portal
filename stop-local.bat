@echo off
cd /d "%~dp0"

set "FRONTEND_PORT=5173"
set "BACKEND_PORT=8000"

echo Stopping UP Circuit Portal local servers ...
echo.

powershell -NoProfile -File "%~dp0scripts\stop-local.ps1" -BackendPort %BACKEND_PORT% -FrontendPort %FRONTEND_PORT% -RepoRoot "%~dp0."
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)

echo.
echo Done.
pause
exit /b 0
