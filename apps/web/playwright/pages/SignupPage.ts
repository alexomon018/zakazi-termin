import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Signup page
 */
export class SignupPage extends BasePage {
  // Form elements
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly loginLink: Locator;
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly usernamePreview: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors
    this.nameInput = page.locator('[data-testid="signup-name-input"]');
    this.emailInput = page.locator('[data-testid="signup-email-input"]');
    this.usernameInput = page.locator('[data-testid="signup-username-input"]');
    this.passwordInput = page.locator('[data-testid="signup-password-input"]');
    this.confirmPasswordInput = page.locator('[data-testid="signup-confirm-password-input"]');
    this.submitButton = page.locator('[data-testid="signup-submit-button"]');
    this.googleButton = page.locator('[data-testid="signup-google-button"]');
    this.loginLink = page.locator('[data-testid="signup-login-link"]');
    this.pageTitle = page.locator('[data-testid="signup-title"]');
    this.pageSubtitle = page.locator('[data-testid="signup-subtitle"]');
    this.usernamePreview = page.locator('[data-testid="signup-username-preview"]');
  }

  /**
   * Navigate to the signup page
   */
  async goto(): Promise<void> {
    await this.page.goto(ROUTES.SIGNUP);
    await this.waitForPageLoad();
  }

  /**
   * Fill the name field
   */
  async fillName(name: string): Promise<void> {
    await this.fillField(this.nameInput, name);
  }

  /**
   * Fill the email field
   */
  async fillEmail(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
  }

  /**
   * Fill the username field
   */
  async fillUsername(username: string): Promise<void> {
    await this.fillField(this.usernameInput, username);
  }

  /**
   * Fill the password field
   */
  async fillPassword(password: string): Promise<void> {
    await this.fillField(this.passwordInput, password);
  }

  /**
   * Fill the confirm password field
   */
  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.fillField(this.confirmPasswordInput, confirmPassword);
  }

  /**
   * Submit the signup form
   */
  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  /**
   * Complete signup with all required fields
   */
  async signup(data: {
    name: string;
    email: string;
    username: string;
    password: string;
  }): Promise<void> {
    await this.fillName(data.name);
    await this.fillEmail(data.email);
    await this.fillUsername(data.username);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.password);
    await this.submit();
  }

  /**
   * Signup and wait for successful navigation to dashboard
   */
  async signupAndExpectSuccess(data: {
    name: string;
    email: string;
    username: string;
    password: string;
  }): Promise<void> {
    await this.signup(data);
    await this.waitForUrl(/\/dashboard/);
  }

  /**
   * Click the Google sign-up button
   */
  async clickGoogleSignUp(): Promise<void> {
    await this.clickButton(this.googleButton);
  }

  /**
   * Navigate to the login page
   */
  async goToLogin(): Promise<void> {
    await this.clickButton(this.loginLink);
    await this.waitForUrl(/\/login/);
  }

  /**
   * Check if the signup form is displayed correctly
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Check if username preview is displayed with correct URL
   */
  async expectUsernamePreview(username: string): Promise<void> {
    await expect(this.usernamePreview).toBeVisible();
    await expect(this.usernamePreview).toContainText(username);
  }

  /**
   * Check for a specific error message
   */
  async expectErrorMessage(message: string): Promise<void> {
    await expect(this.page.locator(`text=${message}`)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check for field-specific validation errors
   */
  async expectFieldError(
    field: "name" | "email" | "username" | "password" | "confirmPassword"
  ): Promise<Locator> {
    const errorLocator = this.page.getByTestId(`signup-${field}-error`);
    await expect(errorLocator).toBeVisible();
    return errorLocator;
  }

  /**
   * Fill password with mismatched confirmation
   */
  async fillPasswordMismatch(password: string, confirmPassword: string): Promise<void> {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
  }

  /**
   * Check username preview contains text
   */
  async expectUsernamePreviewContains(username: string): Promise<void> {
    await expect(this.page.locator(`text=salonko.rs/${username}`)).toBeVisible();
  }
}
