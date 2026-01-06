#!/bin/bash
# Cleanup old Neon backup branches
#
# Keeps the most recent N backup branches and deletes older ones.
# Backup branches are identified by the prefix "backup/pre-deploy-"
#
# Required environment variables:
#   NEON_API_KEY - Neon API key
#   NEON_PROJECT_ID - Neon project ID
#
# Optional environment variables:
#   KEEP_COUNT - Number of backups to keep (default: 5)

set -e

KEEP_COUNT=${KEEP_COUNT:-5}

echo "Cleaning up old backup branches (keeping last $KEEP_COUNT)..."

# Get all backup branches sorted by creation date (newest first)
RESPONSE=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches")

# Extract backup branch IDs, sorted by created_at descending, skip first KEEP_COUNT
BRANCHES_TO_DELETE=$(echo "$RESPONSE" | jq -r \
  --argjson keep "$KEEP_COUNT" \
  '[.branches[] | select(.name | startswith("backup/pre-deploy-"))] | sort_by(.created_at) | reverse | .[$keep:] | .[].id')

if [ -z "$BRANCHES_TO_DELETE" ]; then
  echo "No old backup branches to delete"
  exit 0
fi

DELETED_COUNT=0

for BRANCH_ID in $BRANCHES_TO_DELETE; do
  echo "Deleting old backup branch: $BRANCH_ID"

  RESULT=$(curl -s -X DELETE -H "Authorization: Bearer $NEON_API_KEY" \
    "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID" \
    -w "%{http_code}" -o /dev/null)

  if [ "$RESULT" = "200" ] || [ "$RESULT" = "204" ]; then
    echo "  ✅ Deleted"
    DELETED_COUNT=$((DELETED_COUNT + 1))
  else
    echo "  ⚠️ Failed to delete (HTTP $RESULT)"
  fi
done

echo ""
echo "✅ Cleanup complete: deleted $DELETED_COUNT old backup(s)"

# Output summary for GitHub Actions
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  echo "## 🧹 Backup Cleanup" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "Deleted **$DELETED_COUNT** old backup branch(es)." >> "$GITHUB_STEP_SUMMARY"
  echo "The **$KEEP_COUNT** most recent backups are retained." >> "$GITHUB_STEP_SUMMARY"
fi
