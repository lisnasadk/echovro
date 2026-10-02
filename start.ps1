# EchoVro – Start script (PowerShell)
# -------------------------------------------------------
# This script builds the backend (if needed) and launches the
# Spring Boot application. It also opens the default web browser
# pointing to the app URL (http://localhost:8080).
# -------------------------------------------------------

# Resolve the project root (directory of this script)
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Path to the backend module
$backendPath = Join-Path $projectRoot "backend\echovro"

# Ensure Maven is on the PATH – you can adjust this if needed
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    Write-Error "Maven (mvn) not found in PATH. Install Maven and retry."
    exit 1
}

# Build the jar (skip tests for speed)
Write-Host "Building EchoVro backend..."
Push-Location $backendPath
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Write-Error "Maven build failed. Check the output above."
    Pop-Location
    exit 1
}
Pop-Location

# Path to the generated jar
$jarPath = Join-Path $backendPath "target\echovro-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $jarPath)) {
    Write-Error "Jar not found at $jarPath"
    exit 1
}

# Launch the application as a background job
Write-Host "Starting EchoVro server..."
Start-Process -FilePath "java" -ArgumentList "-jar `"$jarPath`"" -WorkingDirectory $backendPath -NoNewWindow

# Give the server a moment to start
Start-Sleep -Seconds 5

# Open the UI in the default browser
$uiUrl = "http://localhost:8080"
Write-Host "Opening $uiUrl in default browser..."
Start-Process $uiUrl

Write-Host "EchoVro is running. To stop it, close this PowerShell window or use 'Stop-Process' on the 'java' process."
