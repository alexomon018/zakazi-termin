import { expect, test } from "../fixtures";
import { BillingPage } from "../pages";

// Run payment tests serially to avoid race conditions with shared server state
test.describe.configure({ mode: "serial" });

test.describe("Subscription Management", () => {
  test.describe("Cancel Subscription", () => {
    test("should show cancel button for active subscription", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify cancel button is visible
      await billingPage.expectManageSubscriptionCardVisible();
      await billingPage.expectCancelButtonVisible();
    });

    test("should open cancel confirmation dialog", async ({ page, users, subscription }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click cancel button
      await billingPage.clickCancelSubscription();

      // Verify dialog is visible
      await billingPage.expectCancelDialogVisible();
      await expect(billingPage.confirmCancelButton).toBeVisible();
      await expect(billingPage.dismissCancelButton).toBeVisible();
    });

    test("should cancel subscription when confirmed", async ({ page, users, subscription }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Complete cancel flow
      await billingPage.cancelSubscriptionFlow();

      // Verify resume button is now visible (subscription is canceled at period end)
      await billingPage.expectResumeButtonVisible();

      // Verify in database
      const sub = await subscription.getSubscription(user.id);
      expect(sub?.cancelAtPeriodEnd).toBe(true);
    });

    test("should close dialog when dismiss is clicked", async ({ page, users, subscription }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Open cancel dialog
      await billingPage.clickCancelSubscription();
      await billingPage.expectCancelDialogVisible();

      // Dismiss dialog
      await billingPage.dismissCancelDialog();

      // Dialog should be hidden
      await expect(billingPage.cancelSubscriptionDialog).toBeHidden();

      // Cancel button should still be visible (subscription not canceled)
      await billingPage.expectCancelButtonVisible();
    });
  });

  test.describe("Resume Subscription", () => {
    test("should show resume button for canceled subscription", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with canceled subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, {
        interval: "monthly",
        canceledAtPeriodEnd: true,
      });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify resume button is visible
      await billingPage.expectResumeButtonVisible();
    });

    test("should resume subscription when clicked", async ({ page, users, subscription }) => {
      // Create a user with canceled subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, {
        interval: "monthly",
        canceledAtPeriodEnd: true,
      });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click resume
      await billingPage.clickResumeSubscription();

      // Verify cancel button is now visible (subscription is no longer canceled)
      await billingPage.expectCancelButtonVisible();

      // Verify in database
      const sub = await subscription.getSubscription(user.id);
      expect(sub?.cancelAtPeriodEnd).toBe(false);
    });
  });

  test.describe("Manage Payment", () => {
    test("should show manage payment button for active subscription", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify manage payment button is visible
      await expect(billingPage.managePaymentButton).toBeVisible();
      await expect(billingPage.managePaymentButton).toBeEnabled();
    });
  });

  test.describe("Invoice History", () => {
    test("should show invoice history card", async ({ page, users, subscription }) => {
      // Create a user with active subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify invoice history card is visible
      await billingPage.expectInvoiceHistoryVisible();
    });
  });
});
