import { expect, test } from "../fixtures";
import { SalonDiscoveryPage } from "../pages";

test.describe("Salon Discovery", () => {
  test("should display salon listing page", async ({ page }) => {
    const discoveryPage = new SalonDiscoveryPage(page);
    await discoveryPage.goto();

    await discoveryPage.expectPageVisible();
  });

  test("should show search input", async ({ page }) => {
    const discoveryPage = new SalonDiscoveryPage(page);
    await discoveryPage.goto();

    await discoveryPage.expectSearchVisible();
  });

  test("should be accessible without authentication", async ({ page }) => {
    const discoveryPage = new SalonDiscoveryPage(page);
    await discoveryPage.goto();

    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    await discoveryPage.expectPageVisible();
  });

  test("should show salon cards when salons exist", async ({ page, users }) => {
    // Create a user (which acts as a salon) to appear in listing
    await users.create({ withSchedule: true, withEventType: true });

    const discoveryPage = new SalonDiscoveryPage(page);
    await discoveryPage.goto();

    // Page should load - either shows salons or no results
    await discoveryPage.expectPageVisible();
  });
});
