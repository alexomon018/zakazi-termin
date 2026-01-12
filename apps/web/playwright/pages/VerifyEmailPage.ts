import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../lib/constants";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Verify Email page
 */
export class VerifyEmailPage extends BasePage {
  // Form elements
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly codeInput: Locator;
  readonly submitButton: Locator;
  readonly resendButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors
    this.pageTitle = page.locator('[data-testid="verify-email-title"]');
    this.pageSubtitle = page.locator('[data-testid="verify-email-subtitle"]');
    this.codeInput = page.locator('[data-testid="verify-email-code-input"]');
    this.submitButton = page.locator('[data-testid="verify-email-submit-button"]');
    this.resendButton = page.locator('[data-testid="verify-email-resend-button"]');
    this.errorMessage = page.locator('[data-testid="verify-email-error-message"]');
    this.successMessage = page.locator('[data-testid="verify-email-success-message"]');
  }

  /**
   * Navigate to the verify email page with email param
   */
  async goto(email?: string): Promise<void> {
    const url = email
      ? `${ROUTES.VERIFY_EMAIL}?email=${encodeURIComponent(email)}`
      : ROUTES.VERIFY_EMAIL;
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  /**
   * Check if the verify email form is displayed correctly
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageSubtitle).toBeVisible();
    await expect(this.submitButton).toBeVisible();
    await expect(this.resendButton).toBeVisible();
  }

  /**
   * Enter OTP code digit by digit
   */
  async enterCode(code: string): Promise<void> {
    // The InputOTP component uses individual input slots
    // We need to type the code character by character
    for (let i = 0; i < code.length; i++) {
      const slot = this.page.locator(`[data-testid="verify-email-code-input"] input`).nth(i);
      if (await slot.isVisible().catch(() => false)) {
        await slot.fill(code[i]);
      }
    }
  }

  /**
   * Submit the verification form
   */
  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  /**
   * Verify with code and submit
   */
  async verify(code: string): Promise<void> {
    await this.enterCode(code);
    await this.submit();
  }

  /**
   * Click the resend button
   */
  async clickResend(): Promise<void> {
    await this.clickButton(this.resendButton);
  }

  /**
   * Check for a specific error message
   */
  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Check for success message
   */
  async expectSuccessMessage(message: string): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.successMessage).toContainText(message);
  }

  /**
   * Wait for redirect to dashboard after successful verification
   */
  async expectRedirectToDashboard(): Promise<void> {
    await this.waitForUrl(/\/dashboard/);
  }

  /**
   * Check if we are on the verify email page with correct email param
   */
  async expectOnVerifyEmailPage(email: string): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(
        `/verify-email\\?email=${encodeURIComponent(email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
      ),
      { timeout: TIMEOUTS.NAVIGATION }
    );
  }
}
