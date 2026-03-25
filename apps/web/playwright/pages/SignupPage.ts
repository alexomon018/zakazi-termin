import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Signup page (3-section collapsible form)
 *
 * Sections:
 * 1. Google Search - find salon on Google Maps (can skip with "ili popuni rucno")
 * 2. Salon Info - salonName, salonTypes, city, address, phone, email + "Nastavi" button
 * 3. Owner Info - firstName, lastName, email, phone, password, confirmPassword
 */
export class SignupPage extends BasePage {
  // Section headers (clickable to expand)
  readonly googleSection: Locator;
  readonly salonSection: Locator;
  readonly ownerSection: Locator;

  // Google section
  readonly manualFillButton: Locator;

  // Salon info fields
  readonly salonNameInput: Locator;
  readonly salonCityInput: Locator;
  readonly salonAddressInput: Locator;
  readonly salonPhoneInput: Locator;
  readonly salonTypesButton: Locator;
  readonly continueButton: Locator;

  // Owner info fields
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly ownerPhoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Form actions
  readonly submitButton: Locator;
  readonly googleButton: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);

    // Section toggles (the collapsible sections)
    this.googleSection = page.locator("button", { hasText: "Pronadji salon" });
    this.salonSection = page.locator("button", { hasText: "Podaci o salonu" });
    this.ownerSection = page.locator("button", { hasText: "Vas nalog" });

    // Google section - skip button
    this.manualFillButton = page.getByTestId("signup-manual-fill-button");

    // Salon info fields
    this.salonNameInput = page.getByTestId("signup-salon-name-input");
    this.salonCityInput = page.getByTestId("signup-salon-city-input");
    this.salonAddressInput = page.getByTestId("signup-salon-address-input");
    // PhoneInput is a third-party wrapper that doesn't forward data-testid; use id selector
    this.salonPhoneInput = page.locator('input[id="salonPhone"]');
    this.salonTypesButton = page.getByTestId("signup-salon-types-trigger");
    this.continueButton = page.getByRole("button", {
      name: "Nastavi",
      exact: true,
    });

    // Owner info fields
    this.firstNameInput = page.getByTestId("signup-first-name-input");
    this.lastNameInput = page.getByTestId("signup-last-name-input");
    this.emailInput = page.getByTestId("signup-email-input");
    // PhoneInput is a third-party wrapper that doesn't forward data-testid; use id selector
    this.ownerPhoneInput = page.locator('input[id="ownerPhone"]');
    this.passwordInput = page.getByTestId("signup-password-input");
    this.confirmPasswordInput = page.getByTestId("signup-confirm-password-input");

    // Form actions
    this.submitButton = page.getByTestId("signup-submit-button");
    this.googleButton = page.getByTestId("signup-google-button");
    this.loginLink = page.getByTestId("signup-login-link");
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.SIGNUP);
    await this.waitForPageLoad();
  }

  /**
   * Skip Google search and go to salon info section
   */
  async skipGoogleSearch(): Promise<void> {
    await this.manualFillButton.click();
    // Wait for salon info section to expand
    await expect(this.salonNameInput).toBeVisible({ timeout: 5000 });
  }

  /**
   * Expand the salon info section
   */
  async expandSalonSection(): Promise<void> {
    if (!(await this.salonNameInput.isVisible().catch(() => false))) {
      await this.salonSection.click();
      await expect(this.salonNameInput).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Expand the owner info section
   */
  async expandOwnerSection(): Promise<void> {
    if (!(await this.firstNameInput.isVisible().catch(() => false))) {
      await this.ownerSection.click();
      await expect(this.firstNameInput).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Click "Nastavi" to go from salon section to owner section
   */
  async continueToOwnerSection(): Promise<void> {
    await this.continueButton.click();
    await expect(this.firstNameInput).toBeVisible({ timeout: 5000 });
  }

  // Field fill methods
  async fillSalonName(salonName: string): Promise<void> {
    await this.fillField(this.salonNameInput, salonName);
  }

  async fillSalonCity(city: string): Promise<void> {
    await this.fillField(this.salonCityInput, city);
  }

  async fillSalonAddress(address: string): Promise<void> {
    await this.fillField(this.salonAddressInput, address);
  }

  async fillFirstName(firstName: string): Promise<void> {
    await this.fillField(this.firstNameInput, firstName);
  }

  async fillLastName(lastName: string): Promise<void> {
    await this.fillField(this.lastNameInput, lastName);
  }

  async fillEmail(email: string): Promise<void> {
    await this.fillField(this.emailInput, email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.fillField(this.passwordInput, password);
  }

  async fillSalonPhone(phone: string): Promise<void> {
    await this.fillField(this.salonPhoneInput, phone);
  }

  async fillOwnerPhone(phone: string): Promise<void> {
    await this.fillField(this.ownerPhoneInput, phone);
  }

  async fillConfirmPassword(confirmPassword: string): Promise<void> {
    await this.fillField(this.confirmPasswordInput, confirmPassword);
  }

  /**
   * Select at least one salon type from the popover
   */
  async selectSalonType(): Promise<void> {
    await this.salonTypesButton.click();
    // Click the first checkbox in the popover
    const firstCheckbox = this.page.locator('[id^="salon-type-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 3000 });
    await firstCheckbox.click();
    // Close the popover by clicking the confirm button
    await this.page.getByTestId("signup-salon-types-confirm").click();
  }

  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  /**
   * Complete signup with all required fields using the multi-section flow:
   * 1. Skip Google search
   * 2. Fill salon info section
   * 3. Continue to owner section
   * 4. Fill owner info
   * 5. Submit
   */
  async signup(data: {
    firstName: string;
    lastName: string;
    email: string;
    salonName: string;
    password: string;
    salonCity?: string;
    salonAddress?: string;
    salonPhone?: string;
    ownerPhone?: string;
  }): Promise<void> {
    // Step 1: Skip Google search -> opens salon section
    await this.skipGoogleSearch();

    // Step 2: Fill salon info
    await this.fillSalonName(data.salonName);
    await this.selectSalonType();
    await this.fillSalonCity(data.salonCity || "Beograd");
    await this.fillSalonAddress(data.salonAddress || "Ulica 1");
    await this.fillSalonPhone(data.salonPhone || "+381601234567");

    // Step 3: Continue to owner section
    await this.continueToOwnerSection();

    // Step 4: Fill owner info
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillOwnerPhone(data.ownerPhone || "+381607654321");
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.password);

    // Step 5: Submit
    await this.submit();
  }

  /**
   * Signup and wait for successful redirect to verify-email page
   */
  async signupAndExpectSuccess(data: Parameters<SignupPage["signup"]>[0]): Promise<void> {
    await this.signup(data);
    await this.waitForUrl(/\/verify-email\?email=/);
  }

  /**
   * Signup and verify redirect to verify-email page with specific email
   */
  async signupAndExpectVerifyEmail(data: Parameters<SignupPage["signup"]>[0]): Promise<void> {
    await this.signup(data);
    const encodedEmail = encodeURIComponent(data.email.toLowerCase());
    await this.page.waitForURL(
      new RegExp(`/verify-email\\?email=${encodedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      { timeout: 30000 }
    );
  }

  async clickGoogleSignUp(): Promise<void> {
    await this.clickButton(this.googleButton);
  }

  async goToLogin(): Promise<void> {
    await this.clickButton(this.loginLink);
    await this.waitForUrl(/\/login/);
  }

  /**
   * Verify all form fields are accessible by navigating through each section.
   * NOTE: This method has side effects — it expands sections, leaving the form
   * on the owner info section when complete.
   */
  async verifyFormFieldsAccessible(): Promise<void> {
    // Verify the submit button and login link are always visible
    await expect(this.submitButton).toBeVisible();
    await expect(this.loginLink).toBeVisible();

    // Expand salon section and verify fields
    await this.skipGoogleSearch();
    await expect(this.salonNameInput).toBeVisible();

    // Continue to owner section and verify fields
    await this.continueToOwnerSection();
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.confirmPasswordInput).toBeVisible();
  }

  /**
   * Check for a specific error message
   */
  async expectErrorMessage(message: string): Promise<void> {
    // First check for server error message (data-testid)
    const serverErrorLocator = this.page.getByTestId("signup-error-message");
    const hasServerError = await serverErrorLocator.isVisible().catch(() => false);

    if (hasServerError) {
      await expect(serverErrorLocator).toContainText(message, {
        timeout: 10000,
      });
    } else {
      // Fallback to checking for text anywhere on the page
      await expect(this.page.locator(`text=${message}`)).toBeVisible({
        timeout: 10000,
      });
    }
  }

  /**
   * Fill password with mismatched confirmation
   */
  async fillPasswordMismatch(password: string, confirmPassword: string): Promise<void> {
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword);
  }
}
