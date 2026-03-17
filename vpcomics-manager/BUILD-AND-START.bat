@echo off
title VPCOMICS Artist Manager - Rebuilding
echo Rebuilding VPCOMICS Artist Manager...
echo (Run this after updating the app code)
echo.
call npm run generate
echo.
echo Build complete! Starting server...
echo Opening app at http://localhost:4173
echo Close this window to stop the server.
echo.
start http://localhost:4173
serve .output\public -p 4173 --no-clipboard
