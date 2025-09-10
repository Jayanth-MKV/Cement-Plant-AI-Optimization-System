param(
    [Parameter(Mandatory=$true)]
    [string]$Path
)

# Validate that the path exists
if (-not (Test-Path $Path)) {
    Write-Error "Path '$Path' does not exist!"
    exit 1
}

Write-Host "Cleaning Python code in: $Path" -ForegroundColor Green

try {
    # Option 1: Use Ruff for everything (recommended)
    Write-Host "Running Ruff linter with fixes..." -ForegroundColor Yellow
    & uvx ruff check --fix $Path
    
    Write-Host "Running Ruff formatter with line-length 180..." -ForegroundColor Yellow  
    & uvx ruff format --line-length 180 $Path
    
    Write-Host "Code cleaning completed successfully!" -ForegroundColor Green
}
catch {
    Write-Error "Error occurred during code cleaning: $_"
    exit 1
}
