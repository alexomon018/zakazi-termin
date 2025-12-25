import { expect, test } from "../fixtures";
import { LoginPage } from "../pages";

test.describe("Login", () => {
  test("should display login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check form elements are visible
    await loginPage.expectFormVisible();

    // Check page title/header
    await expect(loginPage.pageTitle).toBeVisible();
    await expect(loginPage.pageSubtitle).toBeVisible();
  });

  test("should show validation errors for empty form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Submit empty form
    await loginPage.submit();

    // Should show validation errors
    await loginPage.expectEmailRequired();
  });

  test("should show error for invalid credentials", async ({ page, users }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill in invalid credentials
    await loginPage.login("nonexistent@test.com", "wrongpassword");

    // Should show error message
    await loginPage.expectError("Pogrešan email ili lozinka");
  });

  test("should successfully login with valid credentials", async ({ page, users }) => {
    // Create a test user
    const user = await users.create();

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Login and expect redirect to dashboard
    await loginPage.loginAndExpectSuccess(user.email, user.password);
  });

  test("should redirect authenticated users from login to dashboard", async ({ page, users }) => {
    // Create and login user
    const user = await users.create();
    await users.login(user);

    const loginPage = new LoginPage(page);

    // Try to navigate to login
    await loginPage.goto();

    // Should be redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("should have link to signup page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check signup link exists
    await expect(loginPage.signupLink).toBeVisible();

    // Click and verify navigation
    await loginPage.goToSignup();
  });

  test("should have link to forgot password page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check forgot password link exists
    await expect(loginPage.forgotPasswordLink).toBeVisible();

    // Click and verify navigation
    await loginPage.goToForgotPassword();
  });

  test("should display Google sign-in button", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check Google button exists
    await expect(loginPage.googleButton).toBeVisible();
  });
});
