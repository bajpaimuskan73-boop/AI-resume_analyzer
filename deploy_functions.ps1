# Deploy Firebase Cloud Function: deleteUserAccount
# Usage: Open PowerShell, cd to project root, then run: .\deploy_functions.ps1

Write-Host "Checking for firebase-tools..."
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "firebase CLI not found. Installing globally... (requires npm)"
    npm install -g firebase-tools
}

Write-Host "Please login to Firebase (a browser window will open)."
firebase login

Write-Host "Select your Firebase project (you may be prompted to pick one)."
firebase use --add

Write-Host "Installing function dependencies..."
Set-Location -Path "./functions"
npm install

Write-Host "Deploying function deleteUserAccount..."
firebase deploy --only functions:deleteUserAccount

Write-Host "Deployment finished. Return to project root."
Set-Location -Path "..\"
