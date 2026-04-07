#!/usr/bin/env bash
# Run smoke-tagged Maestro flows (requires Maestro CLI + running app + backend).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: https://maestro.mobile.dev/getting-started" >&2
  exit 1
fi

maestro test "$ROOT/maestro/flows" --include-tags smoke "$@"
