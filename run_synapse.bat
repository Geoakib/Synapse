@echo off
SETLOCAL EnableDelayedExpansion

:: --- 1. SET PROJECT DIRECTORY ---
set "PROJECT_DIR=%~dp0"
cd /d "!PROJECT_DIR!"

echo Starting Synapse...

:: --- 2. ACTIVATE VIRTUAL ENVIRONMENT ---
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [WARNING] virtual environment (venv) not found. Attempting to run with system Python.
)

:: --- 3. OPEN BROWSER ---
:: Wait a couple of seconds for the server to spin up, or just launch it immediately.
:: Most browsers will wait for the port to be open.
start http://127.0.0.1:8001

:: --- 4. START SERVER ---
echo Launching Synapse Backend...
python server.py

:: --- 5. CLEANUP ---
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Synapse failed to start.
    pause
)

ENDLOCAL
