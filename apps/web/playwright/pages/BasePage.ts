import { type Locator, type Page, expect } from "@playwright/test";
import { TIMEOUTS } from "../lib/constants";

/**
 * Base Page Object class that all page objects extend from.
 * Provides common functionality and helper methods for interacting with pages.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the page URL
   * Subclasses can override with additional parameters
   */
  abstract goto(...args: unknown[]): Promise<void>;

  /**
   * Navigate to a URL, waiting only for domcontentloaded to avoid
   * hanging on slow middleware fetch calls (profile/subscription checks).
   */
  protected async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    // Use domcontentloaded as primary wait, with networkidle as a timeout-limited fallback
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {
      // Networkidle may timeout for pages with long-polling or streaming - that's ok
    });
    // Dismiss cookie banner if present to prevent it from blocking interactions
    await this.dismissCookieBanner();
  }

  /**
   * Dismiss the cookie consent banner if it's visible
   */
  protected async dismissCookieBanner(): Promise<void> {
    const acceptButton = this.page.locator('button:has-text("Prihvatam sve")');
    if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await acceptButton.click();
      // Wait for banner to disappear
      await this.page
        .locator('.fixed.bottom-0:has-text("Kolacici")')
        .waitFor({ state: "hidden", timeout: 2000 })
        .catch(() => {});
    }
  }

  /**
   * Wait for an element to be visible
   */
  protected async waitForVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Wait for an element to be hidden
   */
  protected async waitForHidden(locator: Locator): Promise<void> {
    await expect(locator).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Wait for navigation to a specific URL pattern
   */
  protected async waitForUrl(urlPattern: RegExp | string): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: TIMEOUTS.NAVIGATION });
  }

  /**
   * Fill a form field with proper wait
   */
  protected async fillField(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: "visible" });
    await locator.fill(value);
  }

  /**
   * Clear and fill a form field
   */
  protected async clearAndFill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: "visible" });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Click a button and wait for it to be ready
   */
  protected async clickButton(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible" });
    await locator.click();
  }

  /**
   * Wait for a toast/success message to appear and optionally disappear
   */
  async waitForToast(options?: { shouldDisappear?: boolean }): Promise<void> {
    const toast = this.page.getByTestId("toast");
    await expect(toast).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    if (options?.shouldDisappear) {
      await expect(toast).toBeHidden({ timeout: TIMEOUTS.LONG });
    }
  }

  /**
   * Wait for API response with specific endpoint pattern
   */
  protected async waitForApiResponse(urlPattern: string | RegExp, method = "POST"): Promise<void> {
    await this.page.waitForResponse(
      (response) =>
        (typeof urlPattern === "string"
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())) && response.request().method() === method
    );
  }

  /**
   * Wait for mutation to complete by waiting for API response
   * Handles both standard trpc calls and batched requests
   */
  protected async waitForMutation(action: () => Promise<void>, timeoutMs = 30000): Promise<void> {
    // Start waiting for response before executing action to capture it
    const responsePromise = this.page.waitForResponse(
      (response) => {
        const url = response.url();
        const method = response.request().method();
        // Match trpc endpoints (both /api/trpc and /api/trpc/batch patterns)
        return (url.includes("/api/trpc") || url.includes("/trpc")) && method === "POST";
      },
      { timeout: timeoutMs }
    );

    // Execute action and wait for response in parallel
    await Promise.all([responsePromise, action()]);
  }

  /**
   * Check if element is visible (non-throwing)
   */
  protected async isVisible(locator: Locator): Promise<boolean> {
    return await locator.isVisible().catch(() => false);
  }

  /**
   * Get element by data-testid
   */
  protected getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Navigate to a settings sub-page via mobile dropdown or desktop sidebar link.
   * @param mobileLabel  Text shown in the mobile dropdown (e.g. "Moj profil", "Izgled")
   * @param desktopSelector  CSS selector for the desktop sidebar link
   * @param expectedUrlPattern  RegExp to verify the final URL
   */
  protected async openSettingsSubPage(
    mobileLabel: string,
    desktopSelector: string,
    expectedUrlPattern: RegExp
  ): Promise<void> {
    const mobileSettingsBar = this.page.getByTestId("mobile-settings-top-bar");
    const isMobile = await mobileSettingsBar.isVisible().catch(() => false);

    if (isMobile) {
      await mobileSettingsBar.locator('button:has-text("Podešavanja")').click();
      const dropdown = this.page.getByTestId("mobile-settings-dropdown");
      await expect(dropdown).toBeVisible({ timeout: 5000 });
      await dropdown.locator(`text=${mobileLabel}`).click();
    } else {
      const link = this.page.locator(desktopSelector).first();
      await expect(link).toBeVisible({ timeout: 5000 });
      await Promise.all([
        this.page.waitForURL(expectedUrlPattern, { timeout: 10000 }),
        link.click(),
      ]);
    }

    await expect(this.page).toHaveURL(expectedUrlPattern, { timeout: 10000 });
  }

  /**
   * Take a debug screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/debug-${name}.png` });
  }
}
