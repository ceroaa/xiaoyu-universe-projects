$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendRoot = Join-Path $projectRoot "frontend"
$venvPython = Join-Path $projectRoot ".venv\Scripts\python.exe"
$venvUvicorn = Join-Path $projectRoot ".venv\Scripts\uvicorn.exe"

if (-not (Test-Path $venvPython)) {
    throw "Missing virtual environment: $venvPython"
}

if (-not (Test-Path $venvUvicorn)) {
    throw "Missing uvicorn executable: $venvUvicorn"
}

if (-not (Test-Path $frontendRoot)) {
    throw "Missing frontend directory: $frontendRoot"
}

$backendCommand = @"
Set-Location '$projectRoot'
\$env:PYTHONUTF8='1'
& '$venvUvicorn' app.main:app --host 0.0.0.0 --port 8000 --reload
"@

$agentCommand = @"
Set-Location '$projectRoot'
\$env:PYTHONUTF8='1'
& '$venvPython' run_agent_loop.py
"@

$frontendCommand = @"
Set-Location '$frontendRoot'
cmd /c npm.cmd run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand | Out-Null
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", $agentCommand | Out-Null
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand | Out-Null

Write-Host "Started local services in separate PowerShell windows."
Write-Host "Backend:  http://localhost:8000/health"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Bootstrap: http://localhost:8000/dev/bootstrap"
