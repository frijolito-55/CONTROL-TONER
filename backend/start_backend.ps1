 
$ErrorActionPreference = "Stop"

$python = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
$envFile = Join-Path $PSScriptRoot ".env"

if (-not (Test-Path -LiteralPath $python)) {
    Write-Error "No se encontró el entorno virtual. Crea o restaura backend\venv antes de iniciar el servidor."
    exit 1
}

if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Error "No se encontró backend\.env. Crea ese archivo con la configuración del proyecto."
    exit 1
}

& $python -c "import dotenv" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falta python-dotenv. Instálalo con: .\venv\Scripts\python.exe -m pip install python-dotenv"
    exit 1
}

Set-Location -LiteralPath $PSScriptRoot
& $python -m uvicorn main:app --reload --env-file .env
exit $LASTEXITCODE