import { expect, test } from "../fixtures";
import { LandingPage } from "../pages";

test.describe("Landing Page", () => {
  test("should display landing page", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.expectPageVisible();
  });

  test("should show header with navigation", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.expectHeaderVisible();
  });

  test("should show footer", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.expectFooterVisible();
  });

  test("should have signup link", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.expectSignupLinkVisible();
  });

  test("should navigate to signup page", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await landingPage.navigateToSignup();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("should be accessible without authentication", async ({ page }) => {
    const landingPage = new LandingPage(page);
    await landingPage.goto();

    await expect(page).not.toHaveURL(/\/login/);
    await landingPage.expectPageVisible();
  });

  test("should redirect authenticated users to dashboard", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
