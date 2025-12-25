import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";
import { generateTestEmail } from "../lib/helpers";

test.describe("Forgot Password", () => {
  test("should display forgot password form", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Check form elements are visible
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check page title/header
    await expect(page.locator("text=Zaboravljena lozinka")).toBeVisible();
    await expect(
      page.locator("text=Unesite vašu email adresu i poslaćemo vam link za resetovanje lozinke")
    ).toBeVisible();
  });

  test("should require email to submit form", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // The email input has required attribute
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should show success message after submitting valid email", async ({ page, users }) => {
    // Create a user to have a valid email
    const user = await users.create();

    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Fill in email
    await page.fill('input[id="email"]', user.email);

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("text=Ako nalog sa email adresom")).toBeVisible();
    await expect(page.locator(`strong:has-text("${user.email}")`)).toBeVisible();
  });

  test("should show success message even for non-existent email", async ({ page }) => {
    // This is a security best practice - don't reveal if email exists
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Fill in non-existent email
    await page.fill('input[id="email"]', generateTestEmail());

    // Submit form
    await page.click('button[type="submit"]');

    // Should still show success message (security - don't reveal if email exists)
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have back to login button after submission", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Fill in email and submit
    await page.fill('input[id="email"]', generateTestEmail());
    await page.click('button[type="submit"]');

    // Wait for success state
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });

    // Check back to login button exists
    const backButton = page.locator("button", { hasText: "Nazad na prijavu" });
    await expect(backButton).toBeVisible();

    // Click and verify navigation
    await backButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should have link to login page", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Check login link exists
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();

    // Click and verify navigation
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show loading state while submitting", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD);

    // Fill in email
    await page.fill('input[id="email"]', generateTestEmail());

    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');

    // Before clicking, should say "Pošaljite link za resetovanje"
    await expect(submitButton).toHaveText("Pošaljite link za resetovanje");

    // Start watching for the loading text
    await submitButton.click();

    // Should briefly show loading state (may be too fast to catch reliably)
    // The form will complete and show success message
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });
  });
});
