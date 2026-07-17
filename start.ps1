# Get the directory of the script
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     AI CIVILIZATION ECONOMIC SIMULATOR STARTUP    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Activate backend virtual environment
$VenvActivate = Join-Path $PSScriptRoot "backend\.venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) {
    Write-Host "[Startup] Activating virtual environment..." -ForegroundColor Green
    . $VenvActivate
} else {
    Write-Error "Virtual environment not found at backend/.venv. Please ensure it exists."
    exit 1
}

# 2. Start FastAPI backend on port 8000
Write-Host "[Startup] Starting FastAPI backend on port 8000..." -ForegroundColor Green
$backendProcess = Start-Process python -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory (Join-Path $PSScriptRoot "backend") -NoNewWindow -PassThru

# 3. Health check loop
$backendHealthy = $false
$timeoutSeconds = 30
$elapsed = 0

try {
    while (-not $backendHealthy -and $elapsed -lt $timeoutSeconds) {
        if ($backendProcess.HasExited) {
            Write-Error "Backend process exited unexpectedly! Exit code: $($backendProcess.ExitCode)"
            exit 1
        }
        try {
            $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 1
            if ($response.status -eq "healthy") {
                $backendHealthy = $true
                break
            }
        } catch {
            # Connection refused, wait and retry
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }

    if (-not $backendHealthy) {
        Write-Error "Backend did not become healthy within $timeoutSeconds seconds."
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }

    Write-Host "[Startup] Backend is healthy! Starting Vite frontend..." -ForegroundColor Green

    # 4. Open frontend in browser
    Start-Process "http://localhost:5173"

    # 5. Start Vite frontend
    Set-Location (Join-Path $PSScriptRoot "frontend")
    npm run dev
} finally {
    # 6. Clean up backend process on exit
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "[Startup] Stopping backend process..." -ForegroundColor Yellow
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
}
