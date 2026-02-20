import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES, TIMEOUTS } from "../lib/constants";
import { BasePage } from "./BasePage";

export class ResetPasswordPage extends BasePage {
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly invalidLinkWarning: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);

    this.passwordInput = page.locator('input[id="password"]');
    this.confirmPasswordInput = page.locator('input[id="confirmPassword"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator(".text-red-700, .dark\\:text-red-400");
    this.invalidLinkWarning = page.locator("text=Link je nevazeci");
    this.successMessage = page.locator("text=Lozinka je resetovana");
    this.loginLink = page.locator('a[href="/login"]');
  }

  async goto(token: string, email: string): Promise<void> {
    await this.page.goto(
      `${ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
    );
    await this.waitForPageLoad();
  }

  async gotoWithoutParams(): Promise<void> {
    await this.page.goto(ROUTES.RESET_PASSWORD);
    await this.waitForPageLoad();
  }

  async expectFormVisible(): Promise<void> {
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async fillPassword(password: string): Promise<void> {
    await this.fillField(this.passwordInput, password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    await this.fillField(this.confirmPasswordInput, password);
  }

  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    await expect(this.errorMessage).toContainText(message);
  }

  async expectInvalidLinkWarning(): Promise<void> {
    await expect(this.invalidLinkWarning).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectSuccessVisible(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }
}
