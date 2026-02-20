import { createHash } from "node:crypto";
import { expect, test } from "../fixtures";
import { ResetPasswordPage } from "../pages";

test.describe("Reset Password", () => {
  test("should display reset password form with valid token", async ({ page, users, prisma }) => {
    const user = await users.create();
    const rawToken = `test-reset-${Date.now()}`;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: user.email.toLowerCase(),
        token: tokenHash,
        expires: new Date(Date.now() + 3600000),
      },
    });

    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, user.email);
    await resetPage.expectFormVisible();

    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
  });

  test("should show invalid link warning when no params provided", async ({ page }) => {
    const resetPage = new ResetPasswordPage(page);
    await resetPage.gotoWithoutParams();

    await resetPage.expectInvalidLinkWarning();
  });

  test("should show error for mismatched passwords", async ({ page, users, prisma }) => {
    const user = await users.create();
    const rawToken = `test-reset-${Date.now()}`;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: user.email.toLowerCase(),
        token: tokenHash,
        expires: new Date(Date.now() + 3600000),
      },
    });

    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, user.email);

    await resetPage.fillPassword("NewPassword123!");
    await resetPage.fillConfirmPassword("DifferentPassword123!");
    await resetPage.submit();

    await resetPage.expectErrorMessage("Lozinke se ne poklapaju");

    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
  });

  test("should show error for short password", async ({ page, users, prisma }) => {
    const user = await users.create();
    const rawToken = `test-reset-${Date.now()}`;
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.verificationToken.create({
      data: {
        identifier: user.email.toLowerCase(),
        token: tokenHash,
        expires: new Date(Date.now() + 3600000),
      },
    });

    const resetPage = new ResetPasswordPage(page);
    await resetPage.goto(rawToken, user.email);

    await resetPage.fillPassword("short");
    await resetPage.fillConfirmPassword("short");
    await resetPage.submit();

    await resetPage.expectErrorMessage("najmanje 8 karaktera");

    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
  });

  test("should have login link visible", async ({ page }) => {
    const resetPage = new ResetPasswordPage(page);
    await resetPage.gotoWithoutParams();

    await expect(resetPage.loginLink).toBeVisible();
  });
});
