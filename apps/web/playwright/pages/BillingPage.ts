import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES, SELECTORS, TIMEOUTS } from "../lib/constants";
import { BasePage } from "./BasePage";

// Plan tier type for the 4-plan model
export type PlanTier = "starter" | "growth" | "growth_yearly" | "web_presence";

/**
 * Page object for the billing settings page
 */
export class BillingPage extends BasePage {
  // Status card
  readonly statusCard: Locator;
  readonly trialActive: Locator;
  readonly subscriptionActive: Locator;
  readonly subscriptionExpired: Locator;

  // Plan picker (for new subscriptions)
  readonly planPicker: Locator;
  readonly planMonthly: Locator;
  readonly planYearly: Locator;
  readonly subscribeButton: Locator;

  // Plan tier buttons (4-plan model)
  readonly planStarter: Locator;
  readonly planGrowth: Locator;
  readonly planGrowthYearly: Locator;
  readonly planWebPresence: Locator;

  // Change plan (for existing subscriptions)
  readonly changePlanCard: Locator;
  readonly changePlanDialog: Locator;

  // Manage subscription card
  readonly manageSubscriptionCard: Locator;
  readonly managePaymentButton: Locator;
  readonly cancelSubscriptionButton: Locator;
  readonly resumeSubscriptionButton: Locator;

  // Upgrade to yearly (legacy)
  readonly upgradeYearlyCard: Locator;
  readonly upgradeYearlyButton: Locator;
  readonly upgradeYearlyDialog: Locator;
  readonly confirmUpgradeButton: Locator;

  // Downgrade to monthly (legacy)
  readonly downgradeMonthlyCard: Locator;
  readonly downgradeMonthlyButton: Locator;
  readonly downgradeMonthlyDialog: Locator;
  readonly confirmDowngradeButton: Locator;

  // Cancel subscription dialog
  readonly cancelSubscriptionDialog: Locator;
  readonly confirmCancelButton: Locator;
  readonly dismissCancelButton: Locator;

  // Invoice history
  readonly invoiceHistoryCard: Locator;

  constructor(page: Page) {
    super(page);

    // Status card
    this.statusCard = page.locator(SELECTORS.BILLING.STATUS_CARD);
    this.trialActive = page.locator(SELECTORS.BILLING.TRIAL_ACTIVE);
    this.subscriptionActive = page.locator(SELECTORS.BILLING.SUBSCRIPTION_ACTIVE);
    this.subscriptionExpired = page.locator(SELECTORS.BILLING.SUBSCRIPTION_EXPIRED);

    // Plan picker
    this.planPicker = page.locator(SELECTORS.BILLING.PLAN_PICKER);
    this.planMonthly = page.locator(SELECTORS.BILLING.PLAN_MONTHLY);
    this.planYearly = page.locator(SELECTORS.BILLING.PLAN_YEARLY);
    this.subscribeButton = page.locator(SELECTORS.BILLING.SUBSCRIBE_BUTTON);

    // Plan tier buttons (4-plan model)
    this.planStarter = page.locator(SELECTORS.BILLING.PLAN_STARTER);
    this.planGrowth = page.locator(SELECTORS.BILLING.PLAN_GROWTH);
    this.planGrowthYearly = page.locator(SELECTORS.BILLING.PLAN_GROWTH_YEARLY);
    this.planWebPresence = page.locator(SELECTORS.BILLING.PLAN_WEB_PRESENCE);

    // Change plan
    this.changePlanCard = page.locator(SELECTORS.BILLING.CHANGE_PLAN_CARD);
    this.changePlanDialog = page.locator(SELECTORS.BILLING.CHANGE_PLAN_DIALOG);

    // Manage subscription card
    this.manageSubscriptionCard = page.locator(SELECTORS.BILLING.MANAGE_SUBSCRIPTION_CARD);
    this.managePaymentButton = page.locator(SELECTORS.BILLING.MANAGE_PAYMENT_BUTTON);
    this.cancelSubscriptionButton = page.locator(SELECTORS.BILLING.CANCEL_SUBSCRIPTION_BUTTON);
    this.resumeSubscriptionButton = page.locator(SELECTORS.BILLING.RESUME_SUBSCRIPTION_BUTTON);

    // Upgrade to yearly (legacy)
    this.upgradeYearlyCard = page.locator(SELECTORS.BILLING.UPGRADE_YEARLY_CARD);
    this.upgradeYearlyButton = page.locator(SELECTORS.BILLING.UPGRADE_YEARLY_BUTTON);
    this.upgradeYearlyDialog = page.locator(SELECTORS.BILLING.UPGRADE_YEARLY_DIALOG);
    this.confirmUpgradeButton = page.locator(SELECTORS.BILLING.CONFIRM_UPGRADE_BUTTON);

    // Downgrade to monthly (legacy)
    this.downgradeMonthlyCard = page.locator(SELECTORS.BILLING.DOWNGRADE_MONTHLY_CARD);
    this.downgradeMonthlyButton = page.locator(SELECTORS.BILLING.DOWNGRADE_MONTHLY_BUTTON);
    this.downgradeMonthlyDialog = page.locator(SELECTORS.BILLING.DOWNGRADE_MONTHLY_DIALOG);
    this.confirmDowngradeButton = page.locator(SELECTORS.BILLING.CONFIRM_DOWNGRADE_BUTTON);

    // Cancel subscription dialog
    this.cancelSubscriptionDialog = page.locator(SELECTORS.BILLING.CANCEL_SUBSCRIPTION_DIALOG);
    this.confirmCancelButton = page.locator(SELECTORS.BILLING.CONFIRM_CANCEL_BUTTON);
    this.dismissCancelButton = page.locator(SELECTORS.BILLING.DISMISS_CANCEL_BUTTON);

    // Invoice history
    this.invoiceHistoryCard = page.locator(SELECTORS.BILLING.INVOICE_HISTORY_CARD);
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.SETTINGS_BILLING);
    await this.waitForPageLoad();
  }

  // ==================== Status assertions ====================

  async expectTrialActive(): Promise<void> {
    await expect(this.trialActive).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectSubscriptionActive(): Promise<void> {
    await expect(this.subscriptionActive).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectSubscriptionExpired(): Promise<void> {
    await expect(this.subscriptionExpired).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectStatusCardVisible(): Promise<void> {
    await expect(this.statusCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  // ==================== Plan picker actions ====================

  async expectPlanPickerVisible(): Promise<void> {
    await expect(this.planPicker).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectPlanPickerHidden(): Promise<void> {
    await expect(this.planPicker).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  async selectMonthlyPlan(): Promise<void> {
    await this.clickButton(this.planMonthly);
  }

  async selectYearlyPlan(): Promise<void> {
    await this.clickButton(this.planYearly);
  }

  async clickSubscribe(): Promise<void> {
    await this.clickButton(this.subscribeButton);
  }

  // ==================== Plan tier actions (4-plan model) ====================

  /**
   * Select a plan tier in the plan picker
   */
  async selectPlanTier(planTier: PlanTier): Promise<void> {
    const locator = this.getPlanTierLocator(planTier);
    await this.clickButton(locator);
  }

  /**
   * Get the locator for a specific plan tier
   */
  private getPlanTierLocator(planTier: PlanTier): Locator {
    switch (planTier) {
      case "starter":
        return this.planStarter;
      case "growth":
        return this.planGrowth;
      case "growth_yearly":
        return this.planGrowthYearly;
      case "web_presence":
        return this.planWebPresence;
    }
  }

  /**
   * Check if a plan tier is visible in the picker
   */
  async expectPlanTierVisible(planTier: PlanTier): Promise<void> {
    const locator = this.getPlanTierLocator(planTier);
    await expect(locator).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Subscribe to a specific plan tier
   */
  async subscribeToTier(planTier: PlanTier): Promise<void> {
    await this.selectPlanTier(planTier);
    await this.clickSubscribe();
  }

  // ==================== Change plan actions ====================

  async expectChangePlanCardVisible(): Promise<void> {
    await expect(this.changePlanCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectChangePlanCardHidden(): Promise<void> {
    await expect(this.changePlanCard).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectChangePlanDialogVisible(): Promise<void> {
    await expect(this.changePlanDialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Click the change plan button for a specific tier
   * Note: The button is inside the change plan card for each available tier
   */
  async clickChangePlanTo(planTier: PlanTier): Promise<void> {
    // Find the button within the change plan card that corresponds to this tier
    const button = this.changePlanCard.locator(`button:has-text("Pređi na ovaj plan")`).first();
    // For more specific targeting, we'd need a data-testid on each plan's button
    // For now, we'll use the locator with the plan name
    const planButton = this.changePlanCard
      .locator(
        `[data-testid="plan-${planTier}"] button, button[data-testid="change-to-${planTier}"]`
      )
      .first();

    // Try the more specific locator first, fall back to general
    if (await planButton.isVisible().catch(() => false)) {
      await this.clickButton(planButton);
    } else {
      // Use text-based selection as fallback
      await this.clickButton(button);
    }
  }

  /**
   * Confirm plan change in the dialog
   */
  async confirmPlanChange(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.changePlanDialog.locator('button:has-text("Potvrdi promenu")').click();
    });
  }

  /**
   * Complete the change plan flow
   */
  async changePlanFlow(newPlanTier: PlanTier): Promise<void> {
    await this.clickChangePlanTo(newPlanTier);
    await this.expectChangePlanDialogVisible();
    await this.confirmPlanChange();
  }

  // ==================== Manage subscription actions ====================

  async expectManageSubscriptionCardVisible(): Promise<void> {
    await expect(this.manageSubscriptionCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectManageSubscriptionCardHidden(): Promise<void> {
    await expect(this.manageSubscriptionCard).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  async clickManagePayment(): Promise<void> {
    await this.clickButton(this.managePaymentButton);
  }

  async expectCancelButtonVisible(): Promise<void> {
    await expect(this.cancelSubscriptionButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectResumeButtonVisible(): Promise<void> {
    await expect(this.resumeSubscriptionButton).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async clickCancelSubscription(): Promise<void> {
    await this.clickButton(this.cancelSubscriptionButton);
  }

  async clickResumeSubscription(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.resumeSubscriptionButton);
    });
  }

  // ==================== Cancel dialog actions ====================

  async expectCancelDialogVisible(): Promise<void> {
    await expect(this.cancelSubscriptionDialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async confirmCancel(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.confirmCancelButton);
    });
  }

  async dismissCancelDialog(): Promise<void> {
    await this.clickButton(this.dismissCancelButton);
  }

  // ==================== Upgrade to yearly actions ====================

  async expectUpgradeYearlyCardVisible(): Promise<void> {
    await expect(this.upgradeYearlyCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectUpgradeYearlyCardHidden(): Promise<void> {
    await expect(this.upgradeYearlyCard).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  async clickUpgradeToYearly(): Promise<void> {
    await this.clickButton(this.upgradeYearlyButton);
  }

  async expectUpgradeDialogVisible(): Promise<void> {
    await expect(this.upgradeYearlyDialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async confirmUpgrade(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.confirmUpgradeButton);
    });
  }

  // ==================== Downgrade to monthly actions ====================

  async expectDowngradeMonthlyCardVisible(): Promise<void> {
    await expect(this.downgradeMonthlyCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async expectDowngradeMonthlyCardHidden(): Promise<void> {
    await expect(this.downgradeMonthlyCard).toBeHidden({ timeout: TIMEOUTS.MEDIUM });
  }

  async clickDowngradeToMonthly(): Promise<void> {
    await this.clickButton(this.downgradeMonthlyButton);
  }

  async expectDowngradeDialogVisible(): Promise<void> {
    await expect(this.downgradeMonthlyDialog).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  async confirmDowngrade(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.confirmDowngradeButton);
    });
  }

  // ==================== Invoice history ====================

  async expectInvoiceHistoryVisible(): Promise<void> {
    await expect(this.invoiceHistoryCard).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  }

  // ==================== Combined flows ====================

  /**
   * Complete the cancel subscription flow
   */
  async cancelSubscriptionFlow(): Promise<void> {
    await this.clickCancelSubscription();
    await this.expectCancelDialogVisible();
    await this.confirmCancel();
  }

  /**
   * Complete the upgrade to yearly flow
   */
  async upgradeToYearlyFlow(): Promise<void> {
    await this.clickUpgradeToYearly();
    await this.expectUpgradeDialogVisible();
    await this.confirmUpgrade();
  }

  /**
   * Complete the downgrade to monthly flow
   */
  async downgradeToMonthlyFlow(): Promise<void> {
    await this.clickDowngradeToMonthly();
    await this.expectDowngradeDialogVisible();
    await this.confirmDowngrade();
  }
}
