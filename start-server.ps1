$ErrorActionPreference = 'Stop'
$pythonPath = 'C:\Program Files\QGIS 4.2.1\apps\Python312\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) { $pythonPath = 'python' }
Write-Host 'SBBL Jawa Barat: http://localhost:8080 (Ctrl+C untuk berhenti)'
& $pythonPath -m http.server 8080 --bind 127.0.0.1 --directory $PSScriptRoot