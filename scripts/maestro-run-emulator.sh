#!/usr/bin/env bash
set -euo pipefail

# Wait for emulator to be fully booted before proceeding
echo "Waiting for emulator to fully boot..."
adb wait-for-device
# Wait until boot animation has completed
for i in $(seq 1 120); do
  BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)
  if [ "$BOOT_COMPLETED" = "1" ]; then
    echo "Emulator boot completed after ~${i}s"
    break
  fi
  if [ "$i" -eq 120 ]; then
    echo "Emulator failed to boot within 120s"
    adb shell getprop 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

# Extra settle time for system services to stabilize
sleep 5

adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081

# Debug APK from Gradle: .../outputs/apk/debug/*.apk or .../outputs/apk/<variant>/debug/*.apk
APK=$(find "$GITHUB_WORKSPACE/apps/mobile/android" -type f -name "*debug*.apk" -path "*/outputs/apk/*" | head -1)
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
