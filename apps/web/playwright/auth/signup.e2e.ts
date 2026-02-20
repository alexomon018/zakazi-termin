import { expect, test } from "../fixtures";
import { generateTestEmail, generateTestSalonName } from "../lib/helpers";
import { SignupPage } from "../pages";

test.describe("Signup", () => {
  test("should display signup form", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Verify all form fields are accessible (navigates through sections)
    await signupPage.verifyFormFieldsAccessible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Submit empty form (need to navigate to owner section first so all fields are touched)
    await signupPage.skipGoogleSearch();
    await signupPage.continueToOwnerSection();
    await signupPage.submit();

    // Should show validation errors — check for a unique error (salon name has min 3 chars)
    await signupPage.expectErrorMessage("Naziv salona mora imati najmanje 3 karaktera");
  });

  test("should show error for password mismatch", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Navigate through sections and fill all required fields with mismatched passwords
    await signupPage.skipGoogleSearch();
    await signupPage.fillSalonName(generateTestSalonName());
    await signupPage.selectSalonType();
    await signupPage.fillSalonCity("Beograd");
    await signupPage.fillSalonAddress("Ulica 1");
    await signupPage.fillSalonPhone("+381601234567");
    await signupPage.continueToOwnerSection();

    await signupPage.fillFirstName("Test");
    await signupPage.fillLastName("User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillOwnerPhone("+381607654321");
    await signupPage.fillPasswordMismatch("TestPassword123!", "DifferentPassword123!");

    // Submit form
    await signupPage.submit();

    // Should show password mismatch error
    await signupPage.expectErrorMessage("Lozinke se ne poklapaju");
  });

  test("should show error for weak password", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Navigate through sections and fill all required fields with weak password
    await signupPage.skipGoogleSearch();
    await signupPage.fillSalonName(generateTestSalonName());
    await signupPage.selectSalonType();
    await signupPage.fillSalonCity("Beograd");
    await signupPage.fillSalonAddress("Ulica 1");
    await signupPage.fillSalonPhone("+381601234567");
    await signupPage.continueToOwnerSection();

    await signupPage.fillFirstName("Test");
    await signupPage.fillLastName("User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillOwnerPhone("+381607654321");
    await signupPage.fillPasswordMismatch("weak", "weak");

    // Submit form
    await signupPage.submit();

    // Should show password validation error
    await signupPage.expectErrorMessage("Lozinka mora imati najmanje 8 karaktera");
  });

  test("should successfully submit signup and redirect to verify-email", async ({
    page,
    prisma,
  }) => {
    const email = generateTestEmail();
    // Use a short salonName that passes frontend validation (max 20 chars)
    const salonName = `salon${Date.now() % 100000}`;

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Fill in the form using signup method
    await signupPage.signup({
      firstName: "Test",
      lastName: "User",
      email,
      salonName,
      password: "TestPassword123!",
    });

    // Wait for redirect to verify-email page (new flow)
    await expect(page).toHaveURL(/\/verify-email\?email=/, { timeout: 30000 });

    // Verify pending registration was created in database
    const pendingRegistration = await prisma.pendingRegistration.findUnique({
      where: { email: email.toLowerCase() },
    });
    expect(pendingRegistration).toBeTruthy();
    expect(pendingRegistration?.salonName).toBe(salonName);
    expect(pendingRegistration?.ownerFirstName).toBe("Test");
    expect(pendingRegistration?.ownerLastName).toBe("User");

    // Cleanup - delete the pending registration
    if (pendingRegistration) {
      await prisma.pendingRegistration.delete({
        where: { id: pendingRegistration.id },
      });
    }
  });

  test("should show error for duplicate email", async ({ page, users }) => {
    // Create an existing user with a short salonName that passes frontend validation (max 20 chars)
    const shortSalonName = `salon${Date.now() % 100000}`;
    const existingUser = await users.create({ salonName: shortSalonName });

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Try to register with the same email but a different valid salonName
    await signupPage.signup({
      firstName: "Test",
      lastName: "User",
      email: existingUser.email,
      salonName: `new${Date.now() % 10000}`,
      password: "TestPassword123!",
    });

    // Should show error message about existing email (actual message from API)
    await signupPage.expectErrorMessage("Email adresa je vec registrovana");
  });

  test("should show error for duplicate salonName", async ({ page, users }) => {
    // Create an existing user with unique email and short salonName that passes frontend validation
    const uniqueSuffix = `${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
    const shortSalonName = `sal${uniqueSuffix.slice(-10)}`;
    const existingUser = await users.create({
      salonName: shortSalonName,
      email: `dupsalon-${uniqueSuffix}@test.com`,
    });

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Try to register with the same salonName
    await signupPage.signup({
      firstName: "Test",
      lastName: "User",
      email: generateTestEmail(),
      salonName: existingUser.salonName,
      password: "TestPassword123!",
    });

    // Should show error message about existing salonName (actual message from API)
    await signupPage.expectErrorMessage("Naziv salona je zauzet");
  });

  test("should have link to login page", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Check login link exists
    await expect(signupPage.loginLink).toBeVisible();

    // Click and verify navigation
    await signupPage.goToLogin();
  });

  test("should display Google sign-up button", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Check Google button exists
    await expect(signupPage.googleButton).toBeVisible();
  });

  test("should fill salon name field", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Skip Google search to get to salon section
    await signupPage.skipGoogleSearch();

    // Fill salonName and verify it has the value
    await signupPage.fillSalonName("testsalon");
    await expect(signupPage.salonNameInput).toHaveValue("testsalon");
  });
});
