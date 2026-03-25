import { expect, test } from "../fixtures";
import { TIMEOUTS } from "../lib/constants";
import { AvailabilityPage } from "../pages";

test.describe("Edit Availability Schedule", () => {
  let availabilityPage: AvailabilityPage;

  test.beforeEach(async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    availabilityPage = new AvailabilityPage(page);
    await availabilityPage.goto();
  });

  async function navigateToScheduleEditor(page: import("@playwright/test").Page) {
    const scheduleLink = page.locator("text=Working Hours").first();
    await scheduleLink.click();
    await page.waitForURL(/\/dashboard\/availability\//, {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  test("should navigate to schedule editor", async ({ page }) => {
    await navigateToScheduleEditor(page);

    // Should see the schedule name on the editor page
    await expect(page.locator("text=Working Hours")).toBeVisible();
  });

  test("should display day availability rows", async ({ page }) => {
    await navigateToScheduleEditor(page);
    await availabilityPage.waitForPageLoad();

    // Should see days of the week
    await availabilityPage.expectDaysVisible();
  });

  test("should have save button", async ({ page }) => {
    await navigateToScheduleEditor(page);
    await availabilityPage.waitForPageLoad();

    // Save button should exist (may be disabled if no changes)
    const saveButton = page
      .locator('button:has-text("Sačuvaj")')
      .or(page.locator('button:has-text("Save")'))
      .first();
    await expect(saveButton).toBeVisible();
  });

  test("should have back navigation to availability list", async ({ page }) => {
    await navigateToScheduleEditor(page);

    // Should have a back button/link to availability list (in main content, not sidebar)
    const backLink = page.locator('main a[href="/dashboard/availability"]').first();
    await expect(backLink).toBeVisible();
  });

  test("should show date overrides section", async ({ page }) => {
    await navigateToScheduleEditor(page);
    await availabilityPage.waitForPageLoad();

    // "Izuzeci za određene datume" is the actual heading text
    const dateOverrides = page.locator("text=Izuzeci za određene datume").first();
    await expect(dateOverrides).toBeVisible();
  });
});
