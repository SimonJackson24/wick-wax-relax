@echo off
REM Database Migration Script for Hierarchical Categories (Windows)
REM This script runs the migration to set up the hierarchical category structure

echo =====================================
echo Hierarchical Categories Database Migration
echo =====================================

REM Database connection parameters
set DB_NAME=%DB_NAME%
if "%DB_NAME%"=="" set DB_NAME=wick_wax_relax

set DB_USER=%DB_USER%
if "%DB_USER%"=="" set DB_USER=postgres

set DB_HOST=%DB_HOST%
if "%DB_HOST%"=="" set DB_HOST=localhost

set DB_PORT=%DB_PORT%
if "%DB_PORT%"=="" set DB_PORT=5432

echo Database Name: %DB_NAME%
echo Database User: %DB_USER%
echo Database Host: %DB_HOST%
echo Database Port: %DB_PORT%
echo.

REM Check if migration file exists
set MIGRATION_FILE=migrations\012_hierarchical_categories.sql
if not exist "%MIGRATION_FILE%" (
    echo Error: Migration file not found at %MIGRATION_FILE%
    pause
    exit /b 1
)

echo Running migration from %MIGRATION_FILE%...
echo.

REM Run the migration
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f %MIGRATION_FILE%

REM Check if migration was successful
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Migration completed successfully!
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Restart your frontend development server
    echo 3. Access the admin interface to migrate existing categories
    echo 4. Test the new category system
) else (
    echo.
    echo ✗ Migration failed. Please check the error messages above.
    pause
    exit /b 1
)

pause