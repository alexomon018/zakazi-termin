import { expect, test } from "../fixtures";
import { FAQPage, HelpCenterPage } from "../pages";

test.describe("Help Center", () => {
  test("should display help center page", async ({ page }) => {
    const helpPage = new HelpCenterPage(page);
    await helpPage.goto();

    await helpPage.expectPageVisible();
  });

  test("should show search input", async ({ page }) => {
    const helpPage = new HelpCenterPage(page);
    await helpPage.goto();

    await helpPage.expectSearchVisible();
  });

  test("should show categories", async ({ page }) => {
    const helpPage = new HelpCenterPage(page);
    await helpPage.goto();

    await helpPage.expectCategoriesVisible();
  });

  test("should have link to support page", async ({ page }) => {
    const helpPage = new HelpCenterPage(page);
    await helpPage.goto();

    await helpPage.expectSupportLinkVisible();
  });

  test("should be accessible without authentication", async ({ page }) => {
    const helpPage = new HelpCenterPage(page);
    await helpPage.goto();

    await expect(page).not.toHaveURL(/\/login/);
    await helpPage.expectPageVisible();
  });
});

test.describe("FAQ Page", () => {
  test("should display FAQ page", async ({ page }) => {
    const faqPage = new FAQPage(page);
    await faqPage.goto();

    await faqPage.expectPageVisible();
  });

  test("should show FAQ sections", async ({ page }) => {
    const faqPage = new FAQPage(page);
    await faqPage.goto();

    await faqPage.expectFAQSectionsVisible();
  });

  test("should have link to support page", async ({ page }) => {
    const faqPage = new FAQPage(page);
    await faqPage.goto();

    await faqPage.expectSupportLinkVisible();
  });

  test("should show header and footer", async ({ page }) => {
    const faqPage = new FAQPage(page);
    await faqPage.goto();

    await expect(faqPage.header).toBeVisible();
    await expect(faqPage.footer).toBeVisible();
  });
});
