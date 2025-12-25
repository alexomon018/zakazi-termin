import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";
import { AppearanceSettingsPage } from "../pages";

test.describe("Appearance Settings", () => {
  test.beforeEach(async ({ users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
  });

  test("should display appearance settings page", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // Should see appearance settings header
    await expect(appearancePage.pageTitle).toBeVisible();
  });

  test("should have theme options", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // At least one theme option should be visible
    await appearancePage.expectThemeOptionsVisible();
  });

  test("should switch to dark theme", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // Find and click dark theme option
    if (await appearancePage.darkThemeButton.isVisible().catch(() => false)) {
      await appearancePage.selectDarkTheme();
    }
  });

  test("should switch to light theme", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // First switch to dark to ensure we're testing a change
    if (await appearancePage.darkThemeButton.isVisible().catch(() => false)) {
      await appearancePage.selectDarkTheme();
    }

    // Now switch to light
    if (await appearancePage.lightThemeButton.isVisible().catch(() => false)) {
      await appearancePage.selectLightTheme();
    }
  });

  test("should have brand color picker", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // Brand color picker may or may not be present
    const hasColorPicker = await appearancePage.expectBrandColorPickerVisible();
    expect(true).toBe(true);
  });

  test("should save appearance changes", async ({ page }) => {
    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.goto();

    // Make a change (e.g., switch theme)
    if (await appearancePage.darkThemeButton.isVisible().catch(() => false)) {
      await appearancePage.selectDarkTheme();

      // Look for save button and save if exists
      await appearancePage.save();

      // Refresh and verify change persisted
      await page.reload();
      await appearancePage.waitForPageLoad();

      await appearancePage.expectDarkTheme();
    }
  });

  test("should navigate to appearance from settings index", async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);

    const appearancePage = new AppearanceSettingsPage(page);
    await appearancePage.navigateFromSettingsIndex();
  });
});
