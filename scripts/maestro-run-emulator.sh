#!/usr/bin/env bash
set -euo pipefail

adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081

# Debug APK from Gradle: .../outputs/apk/<variant>/debug/*.apk
APK=$(find "$GITHUB_WORKSPACE/apps/mobile/android" -type f -path "*/outputs/apk/*/debug/*.apk" | head -1)
if [ -z "$APK" ]; then
  echo "No debug APK found after assembleDebug"
  find "$GITHUB_WORKSPACE/apps/mobile/android" -type f -name "*.apk" 2>/dev/null || true
  exit 1
fi
echo "Installing $APK"
adb install -r "$APK"

APP_ID="${MAESTRO_APP_ID_SECRET:-}"
if [ -z "$APP_ID" ]; then
  APP_ID="${DEFAULT_MAESTRO_APP_ID}"
fi

bash "$GITHUB_WORKSPACE/scripts/maestro-expand-flows.sh" | xargs -0 maestro test --include-tags smoke -e MAESTRO_APP_ID="$APP_ID"
