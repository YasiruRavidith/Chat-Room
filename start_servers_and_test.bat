@echo off
echo Starting Chat Room 2.0 Servers...
echo =====================================

echo.
echo Starting Django Backend Server...
start "Django Backend" cmd /k "cd /d d:\Stuuuuuuuuupid\Chat Room\Chat Room 2.0\backend && python manage.py runserver 8000"

echo.
echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting React Frontend Server...
start "React Frontend" cmd /k "cd /d d:\Stuuuuuuuuupid\Chat Room\Chat Room 2.0\frontend && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173
echo.
echo Press any key to run AI real-time test...
pause

echo.
echo Running AI Real-time Test...
cd /d "d:\Stuuuuuuuuupid\Chat Room\Chat Room 2.0\backend"
python test_ai_realtime.py

echo.
echo Test completed. Press any key to exit...
pause
