# Build Release APK Helper Script
# Usage: .\build_release.ps1

Write-Host "Setting Gradle Cache to E:\.gradle..."
$env:GRADLE_USER_HOME='E:\.gradle'

if (!(Test-Path "android")) {
    Write-Error "Please run this script from the project root (e:\jjj\mobile)."
    exit 1
}

Push-Location android
Write-Host "Cleaning Project..."
.\gradlew clean

Write-Host "Building Release APK..."
.\gradlew assembleRelease
Pop-Location

Write-Host "Build Complete!"
