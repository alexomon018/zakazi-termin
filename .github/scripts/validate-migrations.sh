#!/bin/bash
# Validate migration files
#
# Checks that all migration files:
# 1. Exist and are not empty
# 2. Have valid SQL content (basic check)
#
# Exits with error if validation fails

set -e

MIGRATIONS_DIR="packages/prisma/migrations"

echo "Validating migration files..."

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "⚠️ No migrations directory found"
  exit 0
fi

ERRORS=0

for file in "$MIGRATIONS_DIR"/*/migration.sql; do
  if [ -f "$file" ]; then
    echo "Validating: $file"

    # Check if file is empty
    if [ ! -s "$file" ]; then
      echo "::error::Empty migration file: $file"
      ERRORS=$((ERRORS + 1))
      continue
    fi

    # Basic content check - should contain SQL keywords
    if ! grep -qiE "(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)" "$file"; then
      echo "::warning::Migration file may not contain valid SQL: $file"
    fi

    echo "  ✅ Valid"
  fi
done

if [ $ERRORS -gt 0 ]; then
  echo ""
  echo "::error::Found $ERRORS invalid migration file(s)"
  exit 1
fi

echo ""
echo "✅ All migration files are valid"
