#!/usr/bin/env bash
# Run every Maestro flow under maestro/flows (excluding _helpers runFlow fragments).
# Same path expansion as maestro-smoke.sh — Maestro does not recurse into subdirectories.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: https://maestro.mobile.dev/getting-started" >&2
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

maestro test "${flows[@]}" "$@"
