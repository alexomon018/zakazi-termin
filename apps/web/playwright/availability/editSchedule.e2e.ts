import { expect, test } from "../fixtures";
import { AvailabilityPage } from "../pages";

test.describe("Edit Availability Schedule", () => {
  let availabilityPage: AvailabilityPage;

  test.beforeEach(async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    availabilityPage = new AvailabilityPage(page);
    await availabilityPage.goto();
  });

  test("should navigate to schedule editor", async ({ page }) => {
    await availabilityPage.navigateToScheduleEditor();

    // Should see the schedule name on the editor page
    await expect(page.locator("text=Working Hours")).toBeVisible();
  });

  test("should display day availability rows", async ({ page }) => {
    await availabilityPage.navigateToScheduleEditor();
    await availabilityPage.waitForPageLoad();

    // Should see days of the week
    await availabilityPage.expectDaysVisible();
  });

  test("should have save button", async ({ page }) => {
    await availabilityPage.navigateToScheduleEditor();
    await availabilityPage.waitForPageLoad();

    // Save button should exist (may be disabled if no changes)
    const saveButton = page
      .locator('button:has-text("Sačuvaj")')
      .or(page.locator('button:has-text("Save")'))
      .first();
    await expect(saveButton).toBeVisible();
  });

  test("should have back navigation to availability list", async () => {
    await availabilityPage.navigateToScheduleEditor();

    // Should have a back button/link to availability list (in main content, not sidebar)
    const backLink = availabilityPage.page
      .locator('main a[href="/dashboard/availability"]')
      .first();
    await expect(backLink).toBeVisible();
  });

  test("should show date overrides section", async () => {
    await availabilityPage.navigateToScheduleEditor();
    await availabilityPage.waitForPageLoad();

    // "Izuzeci za određene datume" is the actual heading text
    const dateOverrides = availabilityPage.page.locator("text=Izuzeci za određene datume").first();
    await expect(dateOverrides).toBeVisible();
  });
});
