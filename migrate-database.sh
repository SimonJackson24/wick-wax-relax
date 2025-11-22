#!/bin/bash

# Database Migration Script for Hierarchical Categories
# This script runs the migration to set up the hierarchical category structure

echo "====================================="
echo "Hierarchical Categories Database Migration"
echo "====================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed or not in PATH"
    exit 1
fi

# Database connection parameters
DB_NAME=${DB_NAME:-wick_wax_relax}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo ""

# Check if migration file exists
MIGRATION_FILE="migrations/012_hierarchical_categories.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found at $MIGRATION_FILE"
    exit 1
fi

echo "Running migration from $MIGRATION_FILE..."
echo ""

# Run the migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATION_FILE"

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Migration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Restart your backend server"
    echo "2. Restart your frontend development server"
    echo "3. Access the admin interface to migrate existing categories"
    echo "4. Test the new category system"
else
    echo ""
    echo "✗ Migration failed. Please check the error messages above."
    exit 1
fi