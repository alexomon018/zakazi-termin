import { expect, test } from "../fixtures";
import { BillingPage } from "../pages";

// Run payment tests serially to avoid race conditions with shared server state
test.describe.configure({ mode: "serial" });

test.describe("Trial Flow", () => {
  test("should display trial status when user has active trial", async ({
    page,
    users,
    subscription,
  }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription with 15 days remaining
    await subscription.createWithTrial(user.id, { daysRemaining: 15 });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Verify trial status is displayed
    await billingPage.expectStatusCardVisible();
    await billingPage.expectTrialActive();
  });

  test("should show plan picker when user is in trial", async ({ page, users, subscription }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 30 });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Verify plan picker is visible during trial
    await billingPage.expectPlanPickerVisible();

    // Verify plan options are available (4-plan model)
    await billingPage.expectPlanTierVisible("starter");
    await billingPage.expectPlanTierVisible("growth");
    await expect(billingPage.subscribeButton).toBeVisible();
  });

  test("should show expired status when trial has expired", async ({
    page,
    users,
    subscription,
  }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 1 });

    // Expire the trial
    await subscription.expireTrial(user.id);

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Verify expired status is displayed
    await billingPage.expectStatusCardVisible();
    await billingPage.expectSubscriptionExpired();
  });

  test("should show plan picker when trial is expired", async ({ page, users, subscription }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription and expire it
    await subscription.createWithTrial(user.id, { daysRemaining: 1 });
    await subscription.expireTrial(user.id);

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Plan picker should still be visible so user can subscribe
    await billingPage.expectPlanPickerVisible();
  });

  test("should allow selecting different plans during trial", async ({
    page,
    users,
    subscription,
  }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 30 });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Plan picker should be visible
    await billingPage.expectPlanPickerVisible();

    // Select growth plan
    await billingPage.selectPlanTier("growth");

    // Verify growth is now selected (has the selected border style)
    await expect(billingPage.planGrowth).toHaveClass(/border-primary/);

    // Select starter plan
    await billingPage.selectPlanTier("starter");

    // Verify starter is now selected
    await expect(billingPage.planStarter).toHaveClass(/border-primary/);

    // Select growth_yearly plan
    await billingPage.selectPlanTier("growth_yearly");

    // Verify growth_yearly is now selected
    await expect(billingPage.planGrowthYearly).toHaveClass(/border-primary/);
  });
});
