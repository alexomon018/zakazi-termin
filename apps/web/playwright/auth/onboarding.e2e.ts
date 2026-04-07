import { hash } from "bcryptjs";
import { expect, test } from "../fixtures";
import { ROUTES } from "../lib/constants";

test.describe("Onboarding - Complete Profile", () => {
  test("should redirect incomplete profile users to onboarding", async ({
    page,
    prisma,
    users,
  }) => {
    // Create a user without complete profile (no salon info)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const email = `onboarding-test-${timestamp}-${random}@test.com`;
    const passwordHash = await hash("TestPassword123!", 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: "Onboarding Test User",
        identityProvider: "EMAIL",
        emailVerified: new Date(),
        password: { create: { hash: passwordHash } },
        // Intentionally omit salonName, salonCity, etc. to trigger onboarding
      },
    });

    // Create trial
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `cus_test_onboarding_${timestamp}`,
        status: "TRIALING",
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    try {
      // Login manually
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

      await page.goto("/login", { waitUntil: "networkidle" });
      await page.fill('input[id="email"]', email);
      await page.fill('input[id="password"]', "TestPassword123!");

      const responsePromise = page.waitForResponse(
        (res) => res.url().includes("/api/auth/") && res.request().method() === "POST",
        { timeout: 30000 }
      );
      await page.click('button[type="submit"]');
      await responsePromise;

      // Must redirect incomplete profile users to onboarding
      try {
        await page.waitForURL(/\/onboarding/, { timeout: 15000 });
      } catch {
        // If stuck on login, session cookie should be set — navigate directly
        await page.goto("/dashboard", { waitUntil: "networkidle" });
        await page.waitForURL(/\/onboarding/, { timeout: 15000 });
      }
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  test("should display onboarding form for incomplete profile", async ({ page, prisma }) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const email = `onboarding-form-${timestamp}-${random}@test.com`;
    const passwordHash = await hash("TestPassword123!", 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: "Form Test User",
        identityProvider: "EMAIL",
        emailVerified: new Date(),
        password: { create: { hash: passwordHash } },
      },
    });

    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `cus_test_form_${timestamp}`,
        status: "TRIALING",
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    try {
      // Login
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

      await page.goto("/login", { waitUntil: "networkidle" });
      await page.fill('input[id="email"]', email);
      await page.fill('input[id="password"]', "TestPassword123!");

      const responsePromise2 = page.waitForResponse(
        (res) => res.url().includes("/api/auth/") && res.request().method() === "POST",
        { timeout: 30000 }
      );
      await page.click('button[type="submit"]');
      await responsePromise2;

      // Wait for redirect to onboarding
      try {
        await page.waitForURL(/\/onboarding/, { timeout: 15000 });
      } catch {
        // If stuck on login, session cookie should be set — navigate directly
        await page.goto("/dashboard", { waitUntil: "networkidle" });
        await page.waitForURL(/\/onboarding/, { timeout: 15000 });
      }

      // Assert we are on the onboarding page
      expect(page.url()).toContain("onboarding");

      // Verify form is visible
      await expect(page.locator("text=Završite podešavanje vašeg salona")).toBeVisible();

      // Verify form fields exist
      await expect(page.locator('input[id="salonName"]')).toBeVisible();
      await expect(page.locator('input[id="salonCity"]')).toBeVisible();
      await expect(page.locator('input[id="salonAddress"]')).toBeVisible();

      // Verify submit button
      await expect(page.locator('button:has-text("Sačuvaj i nastavi na dashboard")')).toBeVisible();
    } finally {
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
