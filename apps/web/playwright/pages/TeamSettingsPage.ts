import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

export class TeamSettingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly inviteMemberButton: Locator;
  readonly createInviteLinkButton: Locator;
  readonly createOrganizationButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Tim")').first();
    this.inviteMemberButton = page.locator('button:has-text("Pozovi putem email-a")').first();
    this.createInviteLinkButton = page
      .locator('button:has-text("Kreiraj link za pozivnicu")')
      .first();
    this.createOrganizationButton = page
      .locator('button:has-text("Kreiraj organizaciju")')
      .or(page.locator('button:has-text("Kreiraj")'))
      .first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.SETTINGS_TEAM);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    // Either team page title or create organization UI should be visible
    const hasTitle = await this.isVisible(this.pageTitle);
    const hasCreateOrg = await this.isVisible(this.createOrganizationButton);
    expect(hasTitle || hasCreateOrg).toBeTruthy();
  }

  async expectMembersListVisible(): Promise<void> {
    const membersSection = this.page.locator("text=Članovi tima").first();
    await expect(membersSection).toBeVisible();
  }

  async expectInviteActionsVisible(): Promise<void> {
    await expect(this.inviteMemberButton).toBeVisible();
  }

  async openInviteDialog(): Promise<void> {
    await this.clickButton(this.inviteMemberButton);
    const dialog = this.page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
  }

  async fillInviteEmail(email: string): Promise<void> {
    const emailInput = this.page
      .locator('[role="dialog"] input[type="email"]')
      .or(this.page.locator('[role="dialog"] input[id="email"]'))
      .first();
    await this.fillField(emailInput, email);
  }

  async submitInvite(): Promise<void> {
    const submitButton = this.page
      .locator('[role="dialog"] button:has-text("Pošalji pozivnicu")')
      .or(this.page.locator('[role="dialog"] button:has-text("Pošalji")'))
      .first();
    await this.waitForMutation(async () => {
      await this.clickButton(submitButton);
    });
  }

  async expectSuccessMessage(text?: string): Promise<void> {
    if (text) {
      await expect(this.page.locator(`text=${text}`).first()).toBeVisible();
    } else {
      // Wait for toast or inline success alert
      const success = this.page
        .locator('[role="alert"]:has-text("uspešno")')
        .or(this.page.locator('[role="status"]'))
        .first();
      await expect(success).toBeVisible();
    }
  }

  async expectCurrentUserInList(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`).first()).toBeVisible();
  }

  async expectCreateOrganizationVisible(): Promise<void> {
    await expect(this.createOrganizationButton).toBeVisible();
  }
}
