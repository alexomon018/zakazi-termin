import { expect, test } from "../fixtures";
import { OutOfOfficePage } from "../pages";

test.describe("Out of Office", () => {
  test.beforeEach(async ({ users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
  });

  test("should display out-of-office page", async ({ page }) => {
    const oooPage = new OutOfOfficePage(page);
    await oooPage.goto();

    await oooPage.expectPageVisible();
  });

  test("should show empty state when no entries", async ({ page }) => {
    const oooPage = new OutOfOfficePage(page);
    await oooPage.goto();

    await oooPage.expectEmptyState();
  });

  test("should have add period button", async ({ page }) => {
    const oooPage = new OutOfOfficePage(page);
    await oooPage.goto();

    await expect(oooPage.addPeriodButton).toBeVisible();
  });

  test("should open add period dialog", async ({ page }) => {
    const oooPage = new OutOfOfficePage(page);
    await oooPage.goto();

    await oooPage.openAddDialog();

    // Dialog should be visible with calendar and reason selector
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();

    // Dialog title should indicate adding a new period
    await expect(dialog.locator("text=Dodaj period odsustva")).toBeVisible();
  });

  test("should create out-of-office entry", async ({ page }) => {
    const oooPage = new OutOfOfficePage(page);
    await oooPage.goto();

    await oooPage.openAddDialog();

    // Navigate to next month to avoid conflicts with past dates in current month
    const dialog = page.locator('[role="dialog"]');
    const nextMonthButton = dialog
      .locator('button[name="next-month"]')
      .or(dialog.locator("button:has(svg.lucide-chevron-right)"))
      .first();
    await nextMonthButton.click();

    // Pick dates in the next month (safe from past-date issues)
    await oooPage.selectDateRange(10, 13);
    await oooPage.selectReason();
    await oooPage.submitDialog();

    // Should show success message
    await oooPage.expectSuccessMessage();
  });
});
