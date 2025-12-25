import { test, expect } from "../fixtures";
import { SignupPage } from "../pages";
import { generateTestEmail, generateTestUsername } from "../lib/helpers";

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
    await signupPage.fillUsername(generateTestUsername());
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
    await signupPage.fillUsername(generateTestUsername());
    await signupPage.fillPasswordMismatch("weak", "weak");

    // Submit form
    await signupPage.submit();

    // Should show password validation error
    await signupPage.expectErrorMessage("Lozinka mora imati najmanje 8 karaktera");
  });

  test("should successfully create account and redirect to dashboard", async ({
    page,
    prisma,
  }) => {
    const email = generateTestEmail();
    // Use a short username that passes frontend validation (max 20 chars)
    const username = `user${Date.now() % 100000}`;

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Fill in the form using signup method
    await signupPage.signup({
      name: "Test User",
      email,
      username,
      password: "TestPassword123!",
    });

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    expect(user).toBeTruthy();
    expect(user?.username).toBe(username.toLowerCase());

    // Cleanup - delete the created user
    if (user) {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("should show error for duplicate email", async ({ page, users }) => {
    // Create an existing user with a short username that passes frontend validation (max 20 chars)
    const shortUsername = `user${Date.now() % 100000}`;
    const existingUser = await users.create({ username: shortUsername });

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Try to register with the same email but a different valid username
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(existingUser.email);
    await signupPage.fillUsername(`new${Date.now() % 10000}`);
    await signupPage.fillPassword("TestPassword123!");
    await signupPage.fillConfirmPassword("TestPassword123!");

    // Submit form
    await signupPage.submit();

    // Should show error message about existing email (actual message from API)
    await signupPage.expectErrorMessage("Email adresa je već registrovana");
  });

  test("should show error for duplicate username", async ({ page, users }) => {
    // Create an existing user with unique email and short username that passes frontend validation
    const uniqueSuffix = `${Date.now()}${Math.random().toString(36).substring(2, 5)}`;
    const shortUsername = `usr${uniqueSuffix.slice(-10)}`;
    const existingUser = await users.create({
      username: shortUsername,
      email: `dupuser-${uniqueSuffix}@test.com`,
    });

    const signupPage = new SignupPage(page);
    await signupPage.goto();
    await signupPage.waitForPageLoad();

    // Try to register with the same username (short enough to pass frontend validation)
    await signupPage.fillName("Test User");
    await signupPage.fillEmail(generateTestEmail());
    await signupPage.fillUsername(existingUser.username);
    await signupPage.fillPassword("TestPassword123!");
    await signupPage.fillConfirmPassword("TestPassword123!");

    // Submit form
    await signupPage.submit();

    // Should show error message about existing username (actual message from API)
    await signupPage.expectErrorMessage("Korisničko ime je zauzeto");
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

  test("should show username preview", async ({ page }) => {
    const signupPage = new SignupPage(page);
    await signupPage.goto();

    // Fill username
    await signupPage.fillUsername("testuser");

    // Check preview text is visible
    await signupPage.expectUsernamePreviewContains("testuser");
  });
});
