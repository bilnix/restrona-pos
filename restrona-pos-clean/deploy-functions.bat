@echo off
echo Deploying Firebase Functions...
echo.

cd functions
echo Installing dependencies...
npm install

echo.
echo Deploying functions...
firebase deploy --only functions

echo.
echo Deployment complete!
pause
