#!/bin/bash
# Check Prisma migration status
#
# Required environment variables:
#   DATABASE_URL - Database connection string
#
# Outputs (via GITHUB_OUTPUT):
#   has_pending - "true" or "false"

set -e

MIGRATIONS_DIR="packages/prisma/migrations"

echo "Checking migration status..."

# First check if migrations directory exists and has migrations
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "has_pending=false" >> "$GITHUB_OUTPUT"
  echo "✅ No migrations directory - nothing to apply"
  exit 0
fi

# Count actual migration folders (exclude migration_lock.toml)
MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -maxdepth 1 -type d -name "[0-9]*" | wc -l | tr -d ' ')

if [ "$MIGRATION_COUNT" -eq 0 ]; then
  echo "has_pending=false" >> "$GITHUB_OUTPUT"
  echo "✅ No migrations found - nothing to apply"
  exit 0
fi

echo "Found $MIGRATION_COUNT migration(s)"

# Check status against the database
STATUS=$(yarn workspace @salonko/prisma prisma migrate status 2>&1) || true
echo "$STATUS"

if echo "$STATUS" | grep -qiE 'up to date|no migrat'; then
  echo "has_pending=false" >> "$GITHUB_OUTPUT"
  echo "✅ No pending migrations"
else
  echo "has_pending=true" >> "$GITHUB_OUTPUT"
  echo "⚠️ Pending migrations detected"
fi
