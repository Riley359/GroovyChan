@echo off
echo Starting Discord Music Bot with Performance Optimizations...
echo.

REM Set Node.js optimization flags
set NODE_OPTIONS=--max-old-space-size=512 --optimize-for-size --gc-interval=100 --expose-gc

REM Set environment variables for better performance
set UV_THREADPOOL_SIZE=4
set NODE_ENV=production

echo Performance flags set:
echo - Memory limit: 512MB
echo - Garbage collection: Optimized
echo - Thread pool: 4 threads
echo - Environment: Production
echo.

echo Starting bot...
node src/index.js

pause
