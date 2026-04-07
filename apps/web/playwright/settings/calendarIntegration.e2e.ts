import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";

test.describe("Calendar Integration Settings", () => {
  test.beforeEach(async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
    await page.goto(ROUTES.SETTINGS, { waitUntil: "networkidle" });
  });

  test("should display settings page", async ({ page }) => {
    const heading = page.locator("main").locator("text=Kalendar integracije");
    await expect(heading).toBeVisible();
  });

  test("should show Google Calendar connect option", async ({ page }) => {
    const calendarSection = page
      .locator("text=Google Calendar")
      .or(page.locator("text=Poveži Google Calendar"))
      .first();
    await expect(calendarSection).toBeVisible();
  });

  test("should show connect button when not connected", async ({ page }) => {
    const connectButton = page
      .locator('button:has-text("Poveži Google Calendar")')
      .or(page.locator('a:has-text("Poveži Google Calendar")'))
      .first();
    await expect(connectButton).toBeVisible();
  });
});
