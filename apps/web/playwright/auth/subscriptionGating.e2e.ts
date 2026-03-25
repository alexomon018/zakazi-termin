import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";

test.describe("Subscription Gating", () => {
  test("should allow access to settings with expired trial", async ({
    page,
    users,
    subscription,
  }) => {
    const user = await users.create({ withSchedule: true });

    // Expire the trial
    await subscription.expireTrial(user.id);

    await users.login(user);

    // Settings should always be accessible
    await page.goto(ROUTES.SETTINGS_PROFILE, { waitUntil: "networkidle" });

    // Should not redirect to billing
    await expect(page).toHaveURL(/\/dashboard\/settings\/profile/);
  });

  test("should allow access to billing with expired trial", async ({
    page,
    users,
    subscription,
  }) => {
    const user = await users.create({ withSchedule: true });
    await subscription.expireTrial(user.id);
    await users.login(user);

    await page.goto(ROUTES.SETTINGS_BILLING, { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/dashboard\/settings\/billing/);
  });

  test("should allow access to gated routes with active trial", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Bookings should be accessible with active trial
    await page.goto(ROUTES.BOOKINGS, { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/dashboard\/bookings/);
  });

  test("should allow access to event types with active trial", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    await page.goto(ROUTES.EVENT_TYPES, { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/dashboard\/event-types/);
  });

  test("should allow access to availability with active trial", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    await page.goto(ROUTES.AVAILABILITY, { waitUntil: "networkidle" });

    await expect(page).toHaveURL(/\/dashboard\/availability/);
  });

  for (const { name, route } of [
    { name: "dashboard", route: ROUTES.DASHBOARD },
    { name: "bookings", route: ROUTES.BOOKINGS },
    { name: "event types", route: ROUTES.EVENT_TYPES },
  ] as const) {
    test(`should redirect unauthenticated users from ${name} to login`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      await page.waitForURL(/\/login/, { timeout: 30000 });
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
