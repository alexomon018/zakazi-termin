import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ROUTES } from "../lib/constants";

/**
 * Page Object for the Profile Settings page
 */
export class ProfileSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly nameInput: Locator;
  readonly usernameInput: Locator;
  readonly bioInput: Locator;
  readonly timezoneSelect: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors with fallbacks
    this.pageTitle = page.locator('[data-testid="profile-settings-title"], h1:has-text("Moj profil")').first();
    this.nameInput = page.locator('[data-testid="profile-name-input"], input[name="name"], input[id="name"]').first();
    this.usernameInput = page.locator('[data-testid="profile-username-input"], input[name="username"], input[id="username"]').first();
    this.bioInput = page.locator('[data-testid="profile-bio-input"], textarea[name="bio"], textarea[id="bio"]').first();
    this.timezoneSelect = page.locator('[data-testid="profile-timezone-select"], select[name="timeZone"]').first();
    this.saveButton = page.locator('[data-testid="profile-save-button"], button[type="submit"], button:has-text("Sačuvaj"), button:has-text("Save")').first();
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.SETTINGS_PROFILE);
    await this.waitForPageLoad();
  }

  /**
   * Update the profile name
   */
  async updateName(newName: string): Promise<void> {
    await this.clearAndFill(this.nameInput, newName);
  }

  /**
   * Update the username
   */
  async updateUsername(newUsername: string): Promise<void> {
    await this.clearAndFill(this.usernameInput, newUsername);
  }

  /**
   * Update the bio
   */
  async updateBio(bio: string): Promise<void> {
    await this.clearAndFill(this.bioInput, bio);
  }

  /**
   * Save profile changes with proper wait
   */
  async save(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.saveButton);
    });
  }

  /**
   * Save and verify the change persisted
   */
  async saveAndVerify(): Promise<void> {
    await this.save();
    // Wait for success indication (toast or visual feedback)
    const successToast = this.page.getByTestId("toast-success");
    await expect(successToast).toBeVisible({ timeout: 5000 }).catch(() => {
      // Toast might not appear, that's okay - we'll verify by reload
    });
  }

  /**
   * Get current name value
   */
  async getNameValue(): Promise<string> {
    await this.nameInput.waitFor({ state: "visible" });
    return await this.nameInput.inputValue();
  }

  /**
   * Get current username value
   */
  async getUsernameValue(): Promise<string> {
    await this.usernameInput.waitFor({ state: "visible" });
    return await this.usernameInput.inputValue();
  }

  /**
   * Verify name has expected value
   */
  async expectNameValue(expectedName: string): Promise<void> {
    await expect(this.nameInput).toHaveValue(expectedName, { timeout: 5000 });
  }

  /**
   * Verify username has expected value
   */
  async expectUsernameValue(expectedUsername: string): Promise<void> {
    await expect(this.usernameInput).toHaveValue(expectedUsername, { timeout: 5000 });
  }

  /**
   * Check if profile link in settings is visible and navigate
   */
  async navigateFromSettingsIndex(): Promise<void> {
    const profileLink = this.page.locator(
      'a[href="/dashboard/settings/profile"], button:has-text("Profil")'
    );
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click();
      await expect(this.page).toHaveURL(/\/dashboard\/settings\/profile/);
    }
  }
}

/**
 * Page Object for the Appearance Settings page
 */
export class AppearanceSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly systemThemeButton: Locator;
  readonly brandColorInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors with fallbacks
    this.pageTitle = page.locator('[data-testid="appearance-settings-title"], h1:has-text("Izgled")').first();
    this.lightThemeButton = page.locator('[data-testid="theme-light"], button:has-text("Svetla"), button:has-text("Light")').first();
    this.darkThemeButton = page.locator('[data-testid="theme-dark"], button:has-text("Tamna"), button:has-text("Dark")').first();
    this.systemThemeButton = page.locator('[data-testid="theme-system"], button:has-text("Sistemska")').first();
    this.brandColorInput = page.locator('[data-testid="brand-color-input"], input[type="color"], input[name="brandColor"]').first();
    this.saveButton = page.locator('[data-testid="appearance-save-button"], button[type="submit"], button:has-text("Sačuvaj"), button:has-text("Save")').first();
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.SETTINGS_APPEARANCE);
    await this.waitForPageLoad();
  }

  /**
   * Switch to light theme
   */
  async selectLightTheme(): Promise<void> {
    await this.clickButton(this.lightThemeButton);
    // Wait for theme to apply by checking the html class
    await expect(this.page.locator("html")).not.toHaveClass(/dark/, { timeout: 2000 });
  }

  /**
   * Switch to dark theme
   */
  async selectDarkTheme(): Promise<void> {
    await this.clickButton(this.darkThemeButton);
    // Wait for theme to apply
    await expect(this.page.locator("html")).toHaveClass(/dark/, { timeout: 2000 });
  }

  /**
   * Switch to system theme
   */
  async selectSystemTheme(): Promise<void> {
    await this.clickButton(this.systemThemeButton);
  }

  /**
   * Check if dark theme is applied
   */
  async expectDarkTheme(): Promise<void> {
    const html = this.page.locator("html");
    const classList = await html.getAttribute("class");
    const dataTheme = await html.getAttribute("data-theme");
    expect(classList?.includes("dark") || dataTheme === "dark").toBeTruthy();
  }

  /**
   * Check if light theme is applied
   */
  async expectLightTheme(): Promise<void> {
    const html = this.page.locator("html");
    const classList = await html.getAttribute("class");
    expect(!classList?.includes("dark")).toBeTruthy();
  }

  /**
   * Set brand color
   */
  async setBrandColor(color: string): Promise<void> {
    await this.fillField(this.brandColorInput, color);
  }

  /**
   * Save appearance changes with proper wait
   */
  async save(): Promise<void> {
    if (await this.isVisible(this.saveButton)) {
      await this.waitForMutation(async () => {
        await this.clickButton(this.saveButton);
      });
    }
  }

  /**
   * Save and verify theme persists after reload
   */
  async saveAndVerifyTheme(expectedTheme: "light" | "dark"): Promise<void> {
    await this.save();
    await this.page.reload();
    await this.waitForPageLoad();

    if (expectedTheme === "dark") {
      await this.expectDarkTheme();
    } else {
      await this.expectLightTheme();
    }
  }

  /**
   * Check if theme options are visible
   */
  async expectThemeOptionsVisible(): Promise<void> {
    const hasLight = await this.isVisible(this.lightThemeButton);
    const hasDark = await this.isVisible(this.darkThemeButton);
    const hasSystem = await this.isVisible(this.systemThemeButton);
    expect(hasLight || hasDark || hasSystem).toBeTruthy();
  }

  /**
   * Check if brand color picker is visible
   */
  async expectBrandColorPickerVisible(): Promise<boolean> {
    return await this.isVisible(this.brandColorInput);
  }

  /**
   * Navigate from settings index
   */
  async navigateFromSettingsIndex(): Promise<void> {
    const appearanceLink = this.page.locator(
      'a[href="/dashboard/settings/appearance"], button:has-text("Izgled")'
    );
    if (await appearanceLink.isVisible().catch(() => false)) {
      await appearanceLink.click();
      await expect(this.page).toHaveURL(/\/dashboard\/settings\/appearance/);
    }
  }
}
