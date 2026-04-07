# Maestro E2E (iOS & Android)

End-to-end tests for **apps/mobile** live under [`maestro/`](../maestro/) and use the **same Next.js backend** as the web app ([`apps/web`](../apps/web/)) and the **same Docker Postgres** as Playwright ([`docker-compose.test.yml`](../docker-compose.test.yml)).

## Prerequisites

- **Docker** + `yarn test:db:start` (Postgres on host port **5433**).
- **`apps/web/.env.test`** (or equivalent env) with at least:
  - `DATABASE_URL` → `postgresql://postgres:postgres@localhost:5433/zakazi_termin_test`
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_APP_URL` → `http://localhost:3000` (or your host IP for physical devices)
- **Maestro CLI** — [install](https://maestro.mobile.dev/getting-started).
- **Mobile app** built for simulator/emulator with **testIDs** matching the flows (see [`maestro/coverage/screens.yaml`](../maestro/coverage/screens.yaml)).

## Backend alignment (same as Playwright)

1. Start test DB: `yarn test:db:start`
2. Sync schema: `yarn workspace @salonko/prisma db:push --skip-generate` (same as [`apps/web/playwright/lib/global-setup.ts`](../apps/web/playwright/lib/global-setup.ts))
3. Run Next: `yarn workspace @salonko/web dev` with the same env as Playwright’s `webServer` in [`playwright.config.ts`](../apps/web/playwright.config.ts)
4. Point the mobile app at the machine running Next:
   - **iOS Simulator**: `http://localhost:3000`
   - **Android Emulator**: `http://10.0.2.2:3000` (not `localhost`)

## Scripts

| Command | Purpose |
|--------|---------|
| `yarn maestro:coverage` | Validates [`maestro/coverage/screens.yaml`](../maestro/coverage/screens.yaml) — every screen lists existing flow files |
| `yarn test:e2e:mobile` | Runs [`scripts/e2e-mobile.sh`](../scripts/e2e-mobile.sh): DB → `db:push` → Next dev → one Maestro flow (pass path as first arg) |
| `yarn maestro:smoke` | Runs all flows under `maestro/flows` with `--include-tags smoke` (expects backend + app already running) |

Example:

```bash
yarn test:e2e:mobile maestro/flows/auth/login_smoke.yaml -e MAESTRO_APP_ID=com.example.app -e E2E_USER_EMAIL=user@test.com -e E2E_USER_PASSWORD='TestPassword123!'
```

## Screen coverage manifest

[`maestro/coverage/screens.yaml`](../maestro/coverage/screens.yaml) is the source of truth: each **screen** in the mobile app should have at least one **flow file**. Update it when you add routes in `apps/mobile`. CI runs `yarn maestro:coverage` to ensure referenced YAML files exist.

## Parity with Playwright (web)

Mobile Maestro flows mirror **product areas** covered by Playwright under `apps/web/playwright/`:

| Web area (Playwright) | Maestro flows |
|----------------------|---------------|
| `playwright/auth/*.e2e.ts` | `maestro/flows/auth/*` |
| `playwright/bookings/*.e2e.ts` | `maestro/flows/bookings/*` |
| `playwright/event-types/*.e2e.ts` | `maestro/flows/event_types/*` |
| `playwright/settings/*.e2e.ts` | `maestro/flows/settings/*` |
| `playwright/bookings/*.e2e.ts` (list) | `maestro/flows/dashboard/dashboard_smoke.yaml` (dashboard home) |

**Test users:** align with [`apps/web/playwright/fixtures/users.ts`](../apps/web/playwright/fixtures/users.ts) — same DB means same credentials and seed assumptions.

## CI

See [`.github/workflows/maestro-e2e.yml`](../.github/workflows/maestro-e2e.yml).

- **`maestro-coverage`** (Ubuntu): runs on every matching PR/push — `yarn maestro:coverage` only.
- **`maestro-e2e-android`** (Ubuntu + Postgres service + Android emulator): runs **only when** `apps/mobile/android/**` exists (Gradle project). It starts Postgres (same credentials as [`docker-compose.test.yml`](../docker-compose.test.yml)), runs `db:push`, starts Next.js, builds `assembleDebug`, then runs Maestro smoke flows on the emulator. Configure repo secrets: `MAESTRO_APP_ID`, `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`; optional `NEXTAUTH_SECRET_E2E` (falls back to a long CI placeholder if unset).

Until `apps/mobile/android` exists, only the coverage job runs — the workflow stays green.

## Maintenance

- Add **testIDs** for every interactive control referenced in flows.
- Prefer **smoke** tags for PR gates; **regression** for full pre-release runs.
- Update `screens.yaml` when adding screens; keep `yarn maestro:coverage` green.
