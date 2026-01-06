#!/bin/bash
# Check for schema changes without corresponding migrations
#
# This script compares the current branch against origin/main to detect:
# 1. Schema changes in schema.prisma
# 2. Whether corresponding migration files exist
#
# Outputs warnings via GitHub Actions annotations

set -e

MIGRATIONS_DIR="packages/prisma/migrations"
SCHEMA_FILE="packages/prisma/schema.prisma"

echo "Checking for migration consistency..."

# Ensure migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "⚠️ Migrations directory not found: $MIGRATIONS_DIR"
  exit 0
fi

# Count existing migrations
MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d | wc -l)
echo "Found $((MIGRATION_COUNT - 1)) migrations"

# Check if there are schema changes without migrations
git diff origin/main -- "$SCHEMA_FILE" > /tmp/schema_diff.txt

if [ -s /tmp/schema_diff.txt ]; then
  echo "Schema changes detected - verifying migration exists"

  git diff origin/main -- "$MIGRATIONS_DIR/" > /tmp/migration_diff.txt

  if [ ! -s /tmp/migration_diff.txt ]; then
    echo "::warning::Schema changes detected but no new migrations found. Run 'yarn db:migrate' to create migration."
    echo ""
    echo "Schema changes:"
    cat /tmp/schema_diff.txt
  else
    echo "✅ Schema changes have corresponding migrations"
  fi
else
  echo "✅ No schema changes detected"
fi

# Cleanup
rm -f /tmp/schema_diff.txt /tmp/migration_diff.txt
