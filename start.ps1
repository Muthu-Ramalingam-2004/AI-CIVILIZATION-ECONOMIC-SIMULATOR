# Get the directory of the script
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "     AI CIVILIZATION ECONOMIC SIMULATOR STARTUP    " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if node is installed
if (Get-Command node -ErrorAction SilentlyContinue) {
    node start.js
} else {
    Write-Error "Node.js is not installed or not in your PATH. Please install Node.js."
    Read-Host -Prompt "Press Enter to exit"
}
