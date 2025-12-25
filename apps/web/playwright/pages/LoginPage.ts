import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ROUTES } from "../lib/constants";

/**
 * Page Object for the Login page
 */
export class LoginPage extends BasePage {
  // Locators using data-testid with fallbacks to existing selectors
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors
    this.emailInput = page.locator('[data-testid="login-email-input"]');
    this.passwordInput = page.locator('[data-testid="login-password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit-button"]');
    this.googleButton = page.locator('[data-testid="login-google-button"]');
    this.signupLink = page.locator('[data-testid="login-signup-link"]');
    this.forgotPasswordLink = page.locator('[data-testid="login-forgot-password-link"]');
    this.pageTitle = page.locator('[data-testid="login-title"]');
    this.pageSubtitle = page.locator('[data-testid="login-subtitle"]');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto(ROUTES.LOGIN);
    await this.waitForPageLoad();
  }

  /**
   * Fill the email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
  }

  /**
   * Fill the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.fillField(this.passwordInput, password);
  }

  /**
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  /**
   * Perform a complete login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Login and wait for successful navigation to dashboard
   */
  async loginAndExpectSuccess(email: string, password: string): Promise<void> {
    await this.login(email, password);
    await this.waitForUrl(/\/dashboard/);
  }

  /**
   * Click the Google sign-in button
   */
  async clickGoogleSignIn(): Promise<void> {
    await this.clickButton(this.googleButton);
  }

  /**
   * Navigate to the signup page
   */
  async goToSignup(): Promise<void> {
    await this.clickButton(this.signupLink);
    await this.waitForUrl(/\/signup/);
  }

  /**
   * Navigate to the forgot password page
   */
  async goToForgotPassword(): Promise<void> {
    await this.clickButton(this.forgotPasswordLink);
    await this.waitForUrl(/\/forgot-password/);
  }

  /**
   * Check if the login form is displayed correctly
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Wait for and get validation error message
   */
  async getValidationError(): Promise<string> {
    const error = this.page.locator('[data-testid="login-error-message"]');
    await expect(error).toBeVisible({ timeout: 10000 });
    return (await error.textContent()) || "";
  }

  /**
   * Check if a specific error message is displayed
   */
  async expectErrorMessage(message: string | RegExp): Promise<void> {
    if (typeof message === "string") {
      await expect(this.page.locator(`text=${message}`)).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.page.locator(`text=${message.source}`)).toBeVisible({ timeout: 10000 });
    }
  }

  /**
   * Check if email validation error is shown
   */
  async expectEmailRequired(): Promise<void> {
    await expect(this.page.locator("text=Email je obavezan")).toBeVisible();
  }

  /**
   * Check for general error text
   */
  async expectError(errorText: string): Promise<void> {
    await expect(this.page.locator(`text=${errorText}`)).toBeVisible({ timeout: 10000 });
  }
}
