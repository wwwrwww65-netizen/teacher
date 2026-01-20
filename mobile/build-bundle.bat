@echo off
echo ========================================
echo Building Android App Bundle (AAB)
echo ========================================

cd /d "%~dp0android"

echo.
echo Step 1: Stopping Gradle Daemons...
call gradlew --stop

echo.
echo Step 2: Cleaning project...
call gradlew clean

echo.
echo Step 3: Building Release Bundle...
call gradlew bundleRelease --no-build-cache --rerun-tasks

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Bundle location:
echo android\app\build\outputs\bundle\release\app-release.aab
echo.
pause
