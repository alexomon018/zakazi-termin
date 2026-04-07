# Maestro E2E (iOS & Android)

End-to-end tests for **apps/mobile** (Expo + Expo Router) live under [`maestro/`](../maestro/) and use the **same Next.js backend** as the web app ([`apps/web`](../apps/web/)) and the **same Docker Postgres** as Playwright ([`docker-compose.test.yml`](../docker-compose.test.yml)).

## Auth model (important)

The mobile login screen uses **OAuth** (`loginWithOAuth` in `apps/mobile/app/(auth)/login.tsx`), not email/password fields. **Smoke flows** only assert the login UI (e.g. “Salonko”, “Prijavite se”) and do **not** tap through OAuth — that would open a browser and require extra automation. Flows tagged **regression** that need an authenticated session currently reuse [`maestro/flows/regression/oauth_session_placeholder.yaml`](../maestro/flows/regression/oauth_session_placeholder.yaml) until you add a dev E2E bypass or OAuth automation.

## Prerequisites

- **Docker** + `yarn test:db:start` (Postgres on host port **5433**).
- **`apps/web/.env.test`** (or equivalent env) with at least:
  - `DATABASE_URL` → `postgresql://postgres:postgres@localhost:5433/zakazi_termin_test`
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_APP_URL` → `http://localhost:3000` (or your host IP for physical devices)
- **Maestro CLI** — [install](https://maestro.mobile.dev/getting-started).
- **App id**: default `com.zakazitermin.app` from [`apps/mobile/app.json`](../apps/mobile/app.json) (`MAESTRO_APP_ID`).

## Backend alignment (same as Playwright)

1. Start test DB: `yarn test:db:start`
2. Sync schema: `yarn workspace @salonko/prisma db:push --skip-generate` (same as [`apps/web/playwright/lib/global-setup.ts`](../apps/web/playwright/lib/global-setup.ts))
3. Run Next: `yarn workspace @salonko/web dev` with the same env as Playwright’s `webServer` in [`playwright.config.ts`](../apps/web/playwright.config.ts)
4. Point the mobile app at the machine running Next (`EXPO_PUBLIC_API_URL` in [`apps/mobile/eas.json`](../apps/mobile/eas.json) development profile uses `http://localhost:3000`):
   - **iOS Simulator**: `http://localhost:3000`
   - **Android Emulator**: `http://10.0.2.2:3000`, or `adb reverse tcp:3000 tcp:3000` + `http://localhost:3000` (CI uses reverse)

## Scripts

| Command | Purpose |
|--------|---------|
| `yarn maestro:coverage` | Validates [`maestro/coverage/screens.yaml`](../maestro/coverage/screens.yaml) — every screen lists existing flow files |
| `yarn test:e2e:mobile` | Runs [`scripts/e2e-mobile.sh`](../scripts/e2e-mobile.sh): DB → `db:push` → Next dev → one Maestro flow (pass path as first arg) |
| `yarn maestro:smoke` | Every `*.yaml` under `maestro/flows` (except `_helpers/`) with `--include-tags smoke`. **Requires `MAESTRO_APP_ID`** in the environment. |
| `yarn maestro:test` | **All** flows, no tag filter (full local regression). **Requires `MAESTRO_APP_ID`**. Same path expansion — Maestro does not recurse into subfolders by default. |

Example:

```bash
yarn test:e2e:mobile maestro/flows/auth/login_smoke.yaml -e MAESTRO_APP_ID=com.zakazitermin.app
MAESTRO_APP_ID=com.zakazitermin.app yarn maestro:smoke
```

## Screen coverage manifest

[`maestro/coverage/screens.yaml`](../maestro/coverage/screens.yaml) lists **Expo routes** under `apps/mobile/app/`. CI runs `yarn maestro:coverage` so every entry references real YAML files. Add rows when you add screens.

## Parity with Playwright (web)

| Web area (Playwright) | Maestro area |
|----------------------|--------------|
| `playwright/auth/*.e2e.ts` | `maestro/flows/auth/*` (OAuth differs from web forms) |
| `playwright/bookings/*.e2e.ts` | `maestro/flows/bookings/*` |
| `playwright/event-types/*.e2e.ts` | `maestro/flows/event_types/*` (tab **Termini** = `(tabs)/index`) |
| `playwright/settings/*.e2e.ts` | `maestro/flows/settings/*` and `setting/*` routes |

**Test users:** Playwright uses DB fixtures ([`apps/web/playwright/fixtures/users.ts`](../apps/web/playwright/fixtures/users.ts)). Mobile OAuth does not use those credentials directly; keep backends aligned for API behavior.

## CI

See [`.github/workflows/maestro-e2e.yml`](../.github/workflows/maestro-e2e.yml).

- **Maestro E2E workflow is manual-only** (`workflow_dispatch`) — it does **not** run on push/PR until you re-enable those triggers in the workflow file.
- When run manually: **`maestro-coverage`** runs `yarn maestro:coverage`; **`maestro-e2e-android`** (if `apps/mobile` exists) runs Postgres, `db:push`, Next, Expo prebuild Android, emulator, Maestro smoke. Optional secrets **`MAESTRO_APP_ID`**, **`NEXTAUTH_SECRET_E2E`**.

## Expo dev client / “Development Build” launcher

**iOS vs Android:** The dev-client URL row differs. Android often exposes **`8081`** as tappable text; iOS Simulator usually shows a full URL (e.g. `http://localhost:8081`). [`launch_app.yaml`](../maestro/flows/_helpers/launch_app.yaml) uses **`tapOn: "8081"`** on Android and **`tapOn: ".*:8081.*"`** on iOS so the Metro URL line matches. If your build shows a different pattern, adjust that step or open the app once before Maestro so the picker is skipped.

If you use **`expo-dev-client`**, a cold start can show the **Development Build** screen instead of your app when:

- Maestro used **`clearState: true`** (removed from `launch_app.yaml`).
- Metro is not running — start it before Maestro: `yarn dev:mobile`.

When **“Development Build”** is visible, the flow dismisses it and waits for **“Salonko”**. Use Metro on port **8081** (Expo default), or change the tap step.

**Android:** if the bundle fails to load, run `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:3000 tcp:3000`.

## Logout flow (`maestro/flows/auth/logout.yaml`)

If a **saved OAuth session** loads, the app opens on tabs — there is no **“Prijavite se”** until you sign out. The logout flow taps **“Više”** (settings tab) → **“Odjavite se”**, then waits for the login CTA. If you are forced onto **`/setting/profile`** (incomplete profile), the tab bar may be hidden; finish onboarding manually or extend the flow for that screen.

## Maintenance

- Prefer **smoke** for PR gates (login UI only until OAuth E2E exists).
- Update `screens.yaml` when routes change; keep `yarn maestro:coverage` green.
