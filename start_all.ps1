Write-Host "Train Time Prediction System Startup"
Write-Host ""

# Kill existing processes on ports
Get-NetTCPConnection -LocalPort 3000, 8000 -ErrorAction SilentlyContinue | ForEach-Object {
    $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

$projectRoot = "c:\Users\VIJAYASOORIYAN.K\Desktop\ML Start\Train time prediction project"
Set-Location $projectRoot

Write-Host "Starting services..."
Write-Host ""

# Start Python API
Write-Host "1. Starting Python FastAPI (port 8000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; uvicorn app:app --reload"

Start-Sleep -Seconds 3

# Start NestJS Backend
Write-Host "2. Starting NestJS Backend (port 3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\backend'; npm run start:dev"

Start-Sleep -Seconds 5

# Start React Frontend
Write-Host "3. Starting React Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; npm start"

Write-Host ""
Write-Host "All services started!"
Write-Host ""
Write-Host "Access: http://localhost:3000"
Write-Host ""
