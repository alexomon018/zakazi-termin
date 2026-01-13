import { expect, test } from "../fixtures";
import { BillingPage } from "../pages";

// Run payment tests serially to avoid race conditions with shared server state
test.describe.configure({ mode: "serial" });

test.describe("Plan Changes", () => {
  test.describe("Change Plan Card Visibility", () => {
    test("should show change plan card for active starter subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with starter subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "starter" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify change plan card is visible
      await billingPage.expectChangePlanCardVisible();
    });

    test("should show change plan card for active growth subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with growth subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "growth" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify change plan card is visible
      await billingPage.expectChangePlanCardVisible();
    });

    test("should show change plan card for active growth yearly subscribers", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with growth_yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "growth_yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify change plan card is visible
      await billingPage.expectChangePlanCardVisible();
    });

    test("should hide change plan card for canceled subscriptions", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with canceled subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, {
        planTier: "starter",
        canceledAtPeriodEnd: true,
      });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Verify change plan card is hidden (subscription is canceled)
      await billingPage.expectChangePlanCardHidden();
    });
  });

  test.describe("Change Plan Dialog", () => {
    test("should open change plan dialog when clicking plan option", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with starter subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "starter" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click on a different plan in the change plan card
      await billingPage.clickChangePlanTo("growth");

      // Verify dialog is visible
      await billingPage.expectChangePlanDialogVisible();
    });

    test("should show plan change confirmation text", async ({ page, users, subscription }) => {
      // Create a user with starter subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "starter" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Click on growth plan
      await billingPage.clickChangePlanTo("growth");

      // Verify dialog shows confirmation text
      await billingPage.expectChangePlanDialogVisible();
      await expect(billingPage.changePlanDialog).toContainText("Promenite plan?");
      await expect(billingPage.changePlanDialog).toContainText("Potvrdi promenu");
    });
  });

  test.describe("Plan Change Flow", () => {
    test("should complete plan change from starter to growth", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with starter subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "starter" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Start plan change flow
      await billingPage.clickChangePlanTo("growth");
      await billingPage.expectChangePlanDialogVisible();

      // Confirm plan change
      await billingPage.confirmPlanChange();

      // Simulate the plan change by updating the DB
      // (In production, this would happen via Stripe webhook)
      await subscription.updatePlanTier(user.id, "growth");

      // Refresh and verify
      await billingPage.goto();

      // Change plan card should still be visible (can change to other plans)
      await billingPage.expectChangePlanCardVisible();
    });

    test("should complete plan change from growth to growth_yearly", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with growth subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "growth" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Complete the plan change flow
      await billingPage.changePlanFlow("growth_yearly");

      // Simulate the plan change by updating the DB
      await subscription.updatePlanTier(user.id, "growth_yearly");

      // Refresh and verify
      await billingPage.goto();

      // Change plan card should still be visible
      await billingPage.expectChangePlanCardVisible();
    });

    test("should complete plan change from growth_yearly to starter", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with growth_yearly subscription
      const user = await users.create({ withSchedule: true });
      await subscription.createWithActiveSubscription(user.id, { planTier: "growth_yearly" });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Complete the plan change flow
      await billingPage.changePlanFlow("starter");

      // Simulate the plan change by updating the DB
      await subscription.updatePlanTier(user.id, "starter");

      // Refresh and verify
      await billingPage.goto();

      // Change plan card should still be visible
      await billingPage.expectChangePlanCardVisible();
    });
  });

  test.describe("Plan Change Not Available", () => {
    test("should hide change plan card for trial users", async ({ page, users, subscription }) => {
      // Create a user with trial subscription (no paid subscription yet)
      const user = await users.create({ withSchedule: true });
      await subscription.createWithTrial(user.id, { daysRemaining: 30 });

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Trial users should see plan picker, not change plan card
      await billingPage.expectChangePlanCardHidden();
      await billingPage.expectPlanPickerVisible();
    });

    test("should hide change plan card for expired subscriptions", async ({
      page,
      users,
      subscription,
    }) => {
      // Create a user with expired trial
      const user = await users.create({ withSchedule: true });
      await subscription.createWithTrial(user.id, { daysRemaining: 30 });
      await subscription.expireTrial(user.id);

      await users.login(user);

      const billingPage = new BillingPage(page);
      await billingPage.goto();

      // Expired users should see plan picker, not change plan card
      await billingPage.expectChangePlanCardHidden();
    });
  });
});
