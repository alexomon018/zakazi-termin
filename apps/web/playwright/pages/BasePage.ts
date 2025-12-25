import { Page, Locator, expect } from "@playwright/test";
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
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
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
  protected async waitForApiResponse(
    urlPattern: string | RegExp,
    method: string = "POST"
  ): Promise<void> {
    await this.page.waitForResponse(
      (response) =>
        (typeof urlPattern === "string"
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url())) &&
        response.request().method() === method
    );
  }

  /**
   * Wait for mutation to complete by waiting for API response
   */
  protected async waitForMutation(action: () => Promise<void>): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/api/trpc") &&
          response.request().method() === "POST"
      ),
      action(),
    ]);
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
   * Take a debug screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/debug-${name}.png` });
  }
}
