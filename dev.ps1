# run-dev.ps1
#
# This script replicates the functionality of the project's Makefile for a Windows/PowerShell environment.
# It accepts a single argument to specify which task to run.
#
# Usage:
#   ./run-dev.ps1 help
#   ./run-dev.ps1 front
#   ./run-dev.ps1 back
#   ./run-dev.ps1 dev

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false, Position = 0)]
    [ValidateSet('help', 'front', 'back', 'agent' , 'dev', "mcp")]
    [string]$Command = "help" # Default to 'help' if no command is provided
)

# Get the directory where the script is located to ensure paths are correct
$PSScriptRoot = Get-Location

# Switch on the command provided
switch ($Command) {
    "help" {
        Write-Host "Available commands:"
        Write-Host "  ./run-dev.ps1 front    - Starts the frontend development server (Vite)"
        Write-Host "  ./run-dev.ps1 back     - Starts the backend development server (Uvicorn with reload)"
        Write-Host "  ./run-dev.ps1 agent    - Starts the agent server"
        Write-Host "  ./run-dev.ps1 mcp      - Starts the mcp server"
        Write-Host "  ./run-dev.ps1 dev      - Starts both frontend and backend development servers"
    }

    "front" {
        Write-Host "Starting frontend development server..."
        Set-Location -Path (Join-Path $PSScriptRoot "frontend")
        npm run dev
    }

    "back" {
        Write-Host "Starting backend development server..."
        Set-Location -Path (Join-Path $PSScriptRoot "server")
        uv run main.py
    }

    "agent" {
        Write-Host "Starting langraph agent server..."
        Set-Location -Path (Join-Path $PSScriptRoot "server/cement_agent")
        uv run langgraph dev
    }

    "mcp" {
        Write-Host "Starting langraph mcp server..."
        Set-Location -Path (Join-Path $PSScriptRoot "server/")
        uv run postgres-mcp --sse-port 8080 --transport sse --access-mode unrestricted
    }

    "dev" {
        Write-Host "Starting both frontend and backend development servers..."

        # Start the frontend server in a new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path (Join-Path '$PSScriptRoot' 'frontend'); Write-Host 'Starting frontend...'; npm run dev"

        # Start the backend server in another new PowerShell window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path (Join-Path '$PSScriptRoot' 'server'); Write-Host 'Starting backend...'; uv run main.py"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path (Join-Path '$PSScriptRoot' 'server/cement_agent'); Write-Host 'Starting agent...'; uv run langgraph dev"
    }

    Default {
        Write-Host "Unknown command: '$Command'" -ForegroundColor Red
        & $MyInvocation.MyCommand.Definition help # Show help for unknown commands
    }
}
