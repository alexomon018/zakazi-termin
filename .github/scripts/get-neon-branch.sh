#!/bin/bash
# Get Neon branch info and construct DATABASE_URL for Vercel-created branches
#
# Required environment variables:
#   NEON_API_KEY - Neon API key
#   NEON_PROJECT_ID - Neon project ID
#   NEON_DB_PASSWORD - Database password
#   BRANCH_NAME - Branch name to look for (e.g., preview/feature/my-feature)
#
# Outputs (via GITHUB_OUTPUT):
#   branch_exists - "true" or "false"
#   branch_name - The branch name
#   db_url - The constructed DATABASE_URL (only if branch exists)

set -e

echo "Looking for Neon branch: $BRANCH_NAME"

# Get branch info from Neon API
RESPONSE=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
  "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches")

# Find the branch by name
BRANCH_INFO=$(echo "$RESPONSE" | jq -r --arg name "$BRANCH_NAME" '.branches[] | select(.name == $name)')

if [ -n "$BRANCH_INFO" ] && [ "$BRANCH_INFO" != "null" ]; then
  BRANCH_ID=$(echo "$BRANCH_INFO" | jq -r '.id')
  echo "Found branch: $BRANCH_NAME (ID: $BRANCH_ID)"

  # Get the endpoint (host) for this branch
  ENDPOINTS=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
    "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID/endpoints")

  HOST=$(echo "$ENDPOINTS" | jq -r '.endpoints[0].host')

  if [ -n "$HOST" ] && [ "$HOST" != "null" ]; then
    # Get the role (user) for the database
    ROLE_NAME=$(curl -s -H "Authorization: Bearer $NEON_API_KEY" \
      "https://console.neon.tech/api/v2/projects/$NEON_PROJECT_ID/branches/$BRANCH_ID/roles" \
      | jq -r '.roles[] | select(.name != "web_access") | .name' | head -1)

    # Construct the DATABASE_URL
    DB_URL="postgresql://${ROLE_NAME}:${NEON_DB_PASSWORD}@${HOST}/neondb?sslmode=require"

    echo "branch_exists=true" >> "$GITHUB_OUTPUT"
    echo "branch_name=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
    echo "db_url=$DB_URL" >> "$GITHUB_OUTPUT"
    echo "✅ Vercel preview branch found: $BRANCH_NAME"
  else
    echo "branch_exists=false" >> "$GITHUB_OUTPUT"
    echo "branch_name=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
    echo "⚠️ Branch found but no endpoint available yet"
  fi
else
  echo "branch_exists=false" >> "$GITHUB_OUTPUT"
  echo "branch_name=$BRANCH_NAME" >> "$GITHUB_OUTPUT"
  echo "⚠️ Vercel preview branch not found yet: $BRANCH_NAME"
  echo "This is normal - Vercel creates the branch during deployment"
fi
