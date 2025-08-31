Write-Host "Deploying Firebase Functions..." -ForegroundColor Green
Write-Host ""

# Navigate to functions directory
Set-Location functions

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Deploying functions..." -ForegroundColor Yellow
firebase deploy --only functions

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Read-Host "Press Enter to continue"
