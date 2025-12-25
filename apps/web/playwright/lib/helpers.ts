import { Page, expect } from "@playwright/test";
import { ROUTES, SELECTORS, TIMEOUTS } from "./constants";

/**
 * Wait for page to be fully loaded (no pending network requests)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for and dismiss any loading indicators
 */
export async function waitForLoadingToComplete(page: Page): Promise<void> {
  const loadingSpinner = page.locator(SELECTORS.UI.LOADING_SPINNER);
  if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await loadingSpinner.waitFor({ state: "hidden", timeout: TIMEOUTS.LONG });
  }
}

/**
 * Navigate to a route and wait for load
 */
export async function navigateTo(page: Page, route: string): Promise<void> {
  await page.goto(route);
  await waitForPageLoad(page);
}

/**
 * Fill a form field by selector
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  const field = page.locator(selector);
  await field.waitFor({ state: "visible" });
  await field.fill(value);
}

/**
 * Click a button and wait for any loading to complete
 */
export async function clickButton(
  page: Page,
  selector: string
): Promise<void> {
  const button = page.locator(selector);
  await button.waitFor({ state: "visible" });
  await button.click();
}

/**
 * Submit a form and wait for navigation or response
 */
export async function submitForm(page: Page): Promise<void> {
  await clickButton(page, SELECTORS.AUTH.SUBMIT_BUTTON);
}

/**
 * Check if user is on the dashboard (authenticated)
 */
export async function assertOnDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/);
}

/**
 * Check if user is on the login page (unauthenticated)
 */
export async function assertOnLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Wait for success toast/message
 */
export async function waitForSuccessMessage(page: Page): Promise<void> {
  const success = page.locator(SELECTORS.UI.SUCCESS_MESSAGE);
  await expect(success).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
}

/**
 * Wait for error message
 */
export async function waitForErrorMessage(page: Page): Promise<void> {
  const error = page.locator(SELECTORS.UI.ERROR_MESSAGE);
  await expect(error).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
}

/**
 * Close any open dialog
 */
export async function closeDialog(page: Page): Promise<void> {
  const dialog = page.locator(SELECTORS.UI.DIALOG);
  if (await dialog.isVisible().catch(() => false)) {
    const closeButton = page.locator(SELECTORS.UI.DIALOG_CLOSE);
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      // Press Escape as fallback
      await page.keyboard.press("Escape");
    }
    await dialog.waitFor({ state: "hidden" });
  }
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
}

/**
 * Generate a unique username for testing
 */
export function generateTestUsername(): string {
  return `testuser${Date.now()}${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(
  page: Page,
  urlPattern: RegExp | string,
  timeout = TIMEOUTS.NAVIGATION
): Promise<void> {
  await page.waitForURL(urlPattern, { timeout });
}

/**
 * Check if element exists on page
 */
export async function elementExists(
  page: Page,
  selector: string
): Promise<boolean> {
  return await page.locator(selector).isVisible().catch(() => false);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Take a screenshot for debugging
 */
export async function takeDebugScreenshot(
  page: Page,
  name: string
): Promise<void> {
  await page.screenshot({ path: `test-results/debug-${name}.png` });
}
