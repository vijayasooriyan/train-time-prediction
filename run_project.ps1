Write-Host "======================================"
Write-Host "Train Time Prediction - Multi-Port Setup"
Write-Host "======================================"
Write-Host ""

# Kill existing processes on ports 3000, 3001, and 8000
Write-Host "Clearing ports 3000, 3001, 8000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000, 3001, 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

$projectRoot = "c:\Users\VIJAYASOORIYAN.K\Desktop\ML Start\Train time prediction project"

Write-Host ""
Write-Host "Starting Services..."
Write-Host ""

# Start Python API on port 8000
Write-Host "1. Starting Python FastAPI (port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; uvicorn app:app --reload --port 8000"

Start-Sleep -Seconds 3

# Start NestJS Backend on port 3000
Write-Host "2. Starting NestJS Backend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run start:dev"

Start-Sleep -Seconds 5

# Start React Frontend on port 3001
Write-Host "3. Starting React Frontend (port 3001)..." -ForegroundColor Green
$env:PORT=3001
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend' ; `$env:PORT=3001 ; npm start"

Write-Host ""
Write-Host "======================================"
Write-Host "All Services Started Successfully!"
Write-Host "======================================"
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "  Python API .......: http://localhost:8000" -ForegroundColor Gray
Write-Host "  Python API Docs ..: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  NestJS Backend ...: http://localhost:3000" -ForegroundColor Gray
Write-Host "  React Frontend ...: http://localhost:3001" -ForegroundColor Blue
Write-Host ""
Write-Host "Web Application: http://localhost:3001"
Write-Host ""
