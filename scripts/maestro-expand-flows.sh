#!/usr/bin/env bash
# Print null-separated paths to all Maestro flow YAML files (excluding _helpers).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
find "$ROOT/maestro/flows" -name "*.yaml" ! -path '*/_helpers/*' -print0 | sort -z
