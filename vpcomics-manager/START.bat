@echo off
title VPCOMICS Artist Manager
echo Starting VPCOMICS Artist Manager...
echo.

REM Check if the built app exists
if not exist ".output\public\index.html" (
    echo Built app not found. Building now - this takes about 30 seconds...
    echo.
    call npm run generate
    echo.
)

echo Opening app at http://localhost:4173
echo Close this window to stop the server.
echo.
start http://localhost:4173
serve .output\public -p 4173 --no-clipboard
