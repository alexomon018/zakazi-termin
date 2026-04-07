#!/usr/bin/env bash
# Start Docker test DB, sync Prisma schema, run Next.js (apps/web), then Maestro.
# Usage:
#   ./scripts/e2e-mobile.sh flows/auth/login_smoke.yaml
# Env: copy apps/web/.env.test or set DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_URL, MAESTRO_APP_ID, E2E_*.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

echo "🐳 Starting test database..."
yarn test:db:start

echo "📦 Syncing Prisma schema to test DB..."
export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/zakazi_termin_test}"
yarn workspace @salonko/prisma db:push --skip-generate

NEXT_PORT="${NEXT_PORT:-3000}"
NEXT_URL="http://localhost:${NEXT_PORT}"

if [ -f "$ROOT/apps/web/.env.test" ]; then
  # shellcheck disable=SC1091
  set -a && source "$ROOT/apps/web/.env.test" && set +a
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5433/zakazi_termin_test}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-$NEXT_URL}"

if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  echo "NEXTAUTH_SECRET is not set. Set it in apps/web/.env.test or export it before running." >&2
  exit 1
fi

echo "🚀 Starting Next.js ($NEXT_URL)..."
yarn workspace @salonko/web dev --port "$NEXT_PORT" &
NEXT_PID=$!

cleanup() {
  echo "🧹 Stopping Next.js (pid $NEXT_PID)..."
  kill "$NEXT_PID" 2>/dev/null || true
}
trap cleanup EXIT

echo "⏳ Waiting for Next.js..."
for _ in $(seq 1 60); do
  if curl -sf "$NEXT_URL" >/dev/null 2>&1; then
    echo "✅ Next.js is up"
    break
  fi
  sleep 2
done

if ! curl -sf "$NEXT_URL" >/dev/null 2>&1; then
  echo "Next.js did not become ready at $NEXT_URL" >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro CLI not found. Install: https://maestro.mobile.dev/getting-started" >&2
  exit 1
fi

FLOW="${1:-maestro/flows/auth/login_smoke.yaml}"
shift || true

echo "📱 Running Maestro: $FLOW $*"
maestro test "$ROOT/$FLOW" "$@"
