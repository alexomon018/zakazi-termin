#!/usr/bin/env bash
# Run smoke-tagged Maestro flows (requires Maestro CLI + running app + backend).
# Maestro does not recurse into subdirectories when given a folder — we pass every *.yaml
# (excluding _helpers fragments). See https://maestro.mobile.dev/cli/test-suites-and-reports
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: https://maestro.mobile.dev/getting-started" >&2
  exit 1
fi

if [ -z "${MAESTRO_APP_ID:-}" ]; then
  echo "MAESTRO_APP_ID is not set. Export it or pass before the script, e.g. MAESTRO_APP_ID=com.zakazitermin.app yarn maestro:smoke" >&2
  exit 1
fi

flows=()
while IFS= read -r f; do
  case "$f" in
    */_helpers/*) continue ;;
    *) flows+=("$f") ;;
  esac
done < <(find "$ROOT/maestro/flows" -name "*.yaml" | sort)

if [ ${#flows[@]} -eq 0 ]; then
  echo "No Maestro flows found under maestro/flows" >&2
  exit 1
fi

maestro test "${flows[@]}" --include-tags smoke "$@"
