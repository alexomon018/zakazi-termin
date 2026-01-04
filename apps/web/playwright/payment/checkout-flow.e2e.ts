import { expect, test } from "../fixtures";
import { BillingPage } from "../pages";

// Run payment tests serially to avoid race conditions with shared server state
test.describe.configure({ mode: "serial" });

test.describe("Checkout Flow", () => {
  test("should show subscribe button during trial", async ({ page, users, subscription }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 30 });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Verify subscribe button is visible
    await expect(billingPage.subscribeButton).toBeVisible();
    await expect(billingPage.subscribeButton).toBeEnabled();
  });

  test("should activate monthly subscription successfully", async ({
    page,
    users,
    subscription,
    prisma,
  }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 30 });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Delete the trial subscription and create an active one to simulate successful checkout
    await subscription.deleteSubscription(user.id);
    await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

    // Navigate to billing page with success param (simulating redirect from Stripe)
    await page.goto("/dashboard/settings/billing?success=true");
    await billingPage.waitForPageLoad();

    // Verify subscription is now active
    await billingPage.expectSubscriptionActive();

    // Plan picker should be hidden now
    await billingPage.expectPlanPickerHidden();

    // Manage subscription card should be visible
    await billingPage.expectManageSubscriptionCardVisible();

    // Verify subscription in database
    const sub = await subscription.getSubscription(user.id);
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.billingInterval).toBe("MONTH");
  });

  test("should activate yearly subscription successfully", async ({
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

    // Delete the trial subscription and create an active yearly one
    await subscription.deleteSubscription(user.id);
    await subscription.createWithActiveSubscription(user.id, { interval: "yearly" });

    // Navigate to billing page with success param
    await page.goto("/dashboard/settings/billing?success=true");
    await billingPage.waitForPageLoad();

    // Verify subscription is now active
    await billingPage.expectSubscriptionActive();

    // Verify subscription in database
    const sub = await subscription.getSubscription(user.id);
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.billingInterval).toBe("YEAR");
  });

  test("should show canceled message when checkout is canceled", async ({
    page,
    users,
    subscription,
  }) => {
    // Create a user and log in
    const user = await users.create({ withSchedule: true });

    // Create a trial subscription
    await subscription.createWithTrial(user.id, { daysRemaining: 30 });

    await users.login(user);

    // Navigate to billing page with canceled param (simulating canceled checkout)
    await page.goto("/dashboard/settings/billing?canceled=true");

    const billingPage = new BillingPage(page);
    await billingPage.waitForPageLoad();

    // Should still be in trial (checkout was canceled)
    await billingPage.expectTrialActive();

    // Plan picker should still be visible
    await billingPage.expectPlanPickerVisible();
  });

  test("should hide plan picker after successful subscription", async ({
    page,
    users,
    subscription,
  }) => {
    // Create a user with active subscription
    const user = await users.create({ withSchedule: true });

    // Create an active subscription directly
    await subscription.createWithActiveSubscription(user.id, { interval: "monthly" });

    await users.login(user);

    const billingPage = new BillingPage(page);
    await billingPage.goto();

    // Plan picker should be hidden for active subscribers
    await billingPage.expectPlanPickerHidden();

    // Manage subscription should be visible
    await billingPage.expectManageSubscriptionCardVisible();
  });
});
