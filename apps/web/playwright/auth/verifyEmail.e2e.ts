import { expect, test } from "../fixtures";
import { generateTestEmail } from "../lib/helpers";
import { VerifyEmailPage } from "../pages";

test.describe("Verify Email", () => {
  test("should display verify email form with correct elements", async ({ page }) => {
    const verifyPage = new VerifyEmailPage(page);
    await verifyPage.goto("test@example.com");

    await verifyPage.expectFormVisible();
  });

  test("should show email address from URL param", async ({ page }) => {
    const email = "user@salonko.rs";
    const verifyPage = new VerifyEmailPage(page);
    await verifyPage.goto(email);

    await expect(page.locator(`text=${email}`)).toBeVisible();
  });

  test("should show error for invalid verification code", async ({ page, prisma }) => {
    const email = generateTestEmail();

    await prisma.pendingRegistration.create({
      data: {
        email: email.toLowerCase(),
        name: "Test Verify User",
        salonName: `verify${Date.now()}`,
        hashedPassword: "$2a$12$fakehashfortest000000000000000000000000000000000",
        verificationCode: "123456",
        expires: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    try {
      const verifyPage = new VerifyEmailPage(page);
      await verifyPage.goto(email);

      // Enter wrong code
      await verifyPage.verify("999999");

      // Should show error
      await expect(
        page.locator("text=nevažeći").or(page.locator("text=pogrešan")).or(verifyPage.errorMessage)
      ).toBeVisible({ timeout: 10000 });
    } finally {
      await prisma.pendingRegistration.deleteMany({ where: { email: email.toLowerCase() } });
    }
  });

  test("should have resend button that is clickable", async ({ page }) => {
    const verifyPage = new VerifyEmailPage(page);
    await verifyPage.goto("test@example.com");

    await expect(verifyPage.resendButton).toBeVisible();
    await expect(verifyPage.resendButton).toBeEnabled();
  });
});
