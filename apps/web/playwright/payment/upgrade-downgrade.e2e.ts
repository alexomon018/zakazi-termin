import { expect, test } from "../fixtures";
import { BillingPage } from "../pages";

// Run payment tests serially to avoid race conditions with shared server state
test.describe.configure({ mode: "serial" });

test.describe("Upgrade and Downgrade", () => {
  test.describe("Upgrade to Yearly", () => {
    test("should show upgrade card for monthly subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with monthly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify upgrade to yearly card is visible
      await billingPage.expectUpgradeYearlyCardVisible();

      // Verify downgrade card is hidden (only for yearly subscribers)
      await billingPage.expectDowngradeMonthlyCardHidden();
    });

    test("should hide upgrade card for yearly subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify upgrade card is hidden (already yearly)
      await billingPage.expectUpgradeYearlyCardHidden();
    });

    test("should open upgrade confirmation dialog", async ({ page, users, subscription }) => {
      // Create a user with monthly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click upgrade button
      await billingPage.clickUpgradeToYearly();

      // Verify dialog is visible
      await billingPage.expectUpgradeDialogVisible();
      await expect(billingPage.confirmUpgradeButton).toBeVisible();
    });

    test("should schedule upgrade to yearly when confirmed", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with monthly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Complete upgrade flow
      await billingPage.upgradeToYearlyFlow();

      // After upgrade is scheduled, the upgrade card should be hidden
      // and downgrade card should be visible (since interval changes to yearly)
      // Note: In real scenario, the webhook would update the interval at period end
      // For testing, we simulate this by updating the DB
      await subscription.updateBillingInterval(user.id, "yearly");

      // Refresh the page to see updated state
      await billingPage.goto();

      // Verify downgrade card is now visible
      await billingPage.expectDowngradeMonthlyCardVisible();
      await billingPage.expectUpgradeYearlyCardHidden();
    });
  });

  test.describe("Downgrade to Monthly", () => {
    test("should show downgrade card for yearly subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify downgrade to monthly card is visible
      await billingPage.expectDowngradeMonthlyCardVisible();

      // Verify upgrade card is hidden (already yearly)
      await billingPage.expectUpgradeYearlyCardHidden();
    });

    test("should hide downgrade card for monthly subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with monthly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify downgrade card is hidden (already monthly)
      await billingPage.expectDowngradeMonthlyCardHidden();
    });

    test("should open downgrade confirmation dialog", async ({ page, users, subscription }) => {
      // Create a user with yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click downgrade button
      await billingPage.clickDowngradeToMonthly();

      // Verify dialog is visible
      await billingPage.expectDowngradeDialogVisible();
      await expect(billingPage.confirmDowngradeButton).toBeVisible();
    });

    test("should schedule downgrade to monthly when confirmed", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Complete downgrade flow
      await billingPage.downgradeToMonthlyFlow();

      // After downgrade is scheduled, the downgrade card should be hidden
      // and upgrade card should be visible (since interval changes to monthly)
      // For testing, we simulate this by updating the DB
      await subscription.updateBillingInterval(user.id, "monthly");

      // Refresh the page to see updated state
      await billingPage.goto();

      // Verify upgrade card is now visible
      await billingPage.expectUpgradeYearlyCardVisible();
      await billingPage.expectDowngradeMonthlyCardHidden();
    });
  });

  test.describe("Upgrade/Downgrade Not Available for Canceled Subscriptions", () => {
    test("should hide upgrade card for canceled monthly subscription", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with canceled monthly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, {
        interval: "monthly",
        canceledAtPeriodEnd: true,
      });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify upgrade card is hidden (subscription is canceled)
      await billingPage.expectUpgradeYearlyCardHidden();
    });

    test("should hide downgrade card for canceled yearly subscription", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with canceled yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, {
        interval: "yearly",
        canceledAtPeriodEnd: true,
      });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify downgrade card is hidden (subscription is canceled)
      await billingPage.expectDowngradeMonthlyCardHidden();
    });
  });
});
