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

    // Verify both plan options are available
    await expect(billingPage.planMonthly).toBeVisible();
    await expect(billingPage.planYearly).toBeVisible();
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

    // Default should be monthly
    await billingPage.expectPlanPickerVisible();

    // Select yearly plan
    await billingPage.selectYearlyPlan();

    // Verify yearly is now selected (has the selected border style)
    await expect(billingPage.planYearly).toHaveClass(/border-primary/);

    // Select monthly plan back
    await billingPage.selectMonthlyPlan();

    // Verify monthly is now selected
    await expect(billingPage.planMonthly).toHaveClass(/border-primary/);
  });
});
