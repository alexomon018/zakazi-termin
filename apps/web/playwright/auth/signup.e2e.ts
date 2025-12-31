import { expect, test } from "../fixtures";
import { generateTestEmail, generateTestSalonName } from "../lib/helpers";
import { SignupPage } from "../pages";

test.describe("Signup", () => {
  test("should display signup form", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Check form elements are visible
    await signupPage.expectFormVisible();

    // Check page title/header
    await expect(signupPage.pageTitle).toBeVisible();
    await expect(signupPage.pageSubtitle).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Submit empty form
    await signupPage.submit();

    // Should show validation errors (the actual message from zod schema)
    await signupPage.expectErrorMessage("Ime mora imati najmanje 2 karaktera");
  });

  test("should show error for password mismatch", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Fill form with mismatched passwords
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillSalonName(generateTestSalonName());
    await signupPage.fillPasswordMismatch("TestPassword123!", "DifferentPassword123!");

    // Submit form
    await signupPage.submit();

    // Should show password mismatch error
    await signupPage.expectErrorMessage("Lozinke se ne poklapaju");
  });

  test("should show error for weak password", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Fill form with weak password
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillSalonName(generateTestSalonName());
    await signupPage.fillPasswordMismatch("weak", "weak");

    // Submit form
    await signupPage.submit();

    // Should show password validation error
    await signupPage.expectErrorMessage("Lozinka mora imati najmanje 8 karaktera");
  });

  test("should successfully create account and redirect to dashboard", async ({ page, prisma }) => {
    const email = generateTestEmail();
    // Use a short salonName that passes frontend validation (max 20 chars)
    const salonName = `salon${Date.now() % 100000}`;

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Fill in the form using signup method
    await signupPage.signup({
      name: "Test User",
      email,
      salonName,
      password: "TestPassword123!",
    });

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    expect(user).toBeTruthy();
    expect(user?.salonName).toBe(salonName.toLowerCase());

    // Cleanup - delete the created user
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
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
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(existingUser.email);
    await signupPage.fillSalonName(`new${Date.now() % 10000}`);
    await signupPage.fillPassword("TestPassword123!");
    await signupPage.fillConfirmPassword("TestPassword123!");

    // Submit form
    await signupPage.submit();

    // Should show error message about existing email (actual message from API)
    await signupPage.expectErrorMessage("Email adresa je već registrovana");
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

    // Try to register with the same salonName (short enough to pass frontend validation)
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillSalonName(existingUser.salonName);
    await signupPage.fillPassword("TestPassword123!");
    await signupPage.fillConfirmPassword("TestPassword123!");

    // Submit form
    await signupPage.submit();

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

  test("should show salonName preview", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Fill salonName
    await signupPage.fillSalonName("testsalon");

    // Check preview text is visible
    await signupPage.expectSalonNamePreviewContains("testsalon");
  });
});
