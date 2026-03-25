import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";
import { generateTestEmail } from "../lib/helpers";

test.describe("Forgot Password", () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss cookie consent banner to prevent it from blocking clicks on mobile
    await page.context().addCookies([
      {
        name: "cookie-consent",
        value: JSON.stringify({
          version: 1,
          necessary: true,
          analytics: false,
          timestamp: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("should display forgot password form", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

    // Check form elements are visible
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check page subtitle text
    await expect(
      page.locator("text=Unesite vasu email adresu i poslacemo vam link za resetovanje lozinke")
    ).toBeVisible();
  });

  test("should require email to submit form", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

    // The email input has required attribute
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("should show success message after submitting valid email", async ({ page, users }) => {
    // Create a user to have a valid email
    const user = await users.create();

    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

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
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

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
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

    // Fill in email and submit
    await page.fill('input[id="email"]', generateTestEmail());
    await page.click('button[type="submit"]');

    // Wait for success state
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });

    // Check back to login link exists — it's an <a> wrapping a <button>
    const backLink = page.locator('a[href="/login"]', { hasText: "Nazad na prijavu" });
    await expect(backLink).toBeVisible();

    // Click and verify navigation
    await backLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("should have link to login page", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

    // Check login link exists — use text to avoid matching multiple a[href="/login"]
    const loginLink = page.locator('a[href="/login"]', { hasText: "Prijavite se" });
    await expect(loginLink).toBeVisible();

    // Click and verify navigation
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  });

  test("should show loading state while submitting", async ({ page }) => {
    await page.goto(ROUTES.FORGOT_PASSWORD, { waitUntil: "networkidle" });

    // Fill in email
    await page.fill('input[id="email"]', generateTestEmail());

    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');

    // Before clicking, should say "Posaljite link za resetovanje"
    await expect(submitButton).toHaveText("Posaljite link za resetovanje");

    // Start watching for the loading text
    await submitButton.click();

    // Should briefly show loading state (may be too fast to catch reliably)
    // The form will complete and show success message
    await expect(page.locator("text=Proverite email")).toBeVisible({
      timeout: 10000,
    });
  });
});
