@echo off
echo Installing WebSocket dependencies...
pip install "uvicorn[standard]" websockets wsproto
echo.
echo Dependencies installed. Starting ASGI server...
uvicorn backend.asgi:application --host 127.0.0.1 --port 8000 --reload
pause
