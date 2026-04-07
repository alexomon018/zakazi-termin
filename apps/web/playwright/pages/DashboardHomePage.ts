import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

export class DashboardHomePage extends BasePage {
  readonly root: Locator;
  readonly welcomeHeading: Locator;
  readonly todayStatsCard: Locator;
  readonly upcomingStatsCard: Locator;
  readonly eventTypesStatsCard: Locator;
  readonly eventTypesStatsValue: Locator;
  readonly emptyBookingsMessage: Locator;
  readonly viewAllBookingsButton: Locator;
  readonly createEventTypeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.root = page.locator("main");
    this.welcomeHeading = this.root.locator('h1:has-text("Dobrodošli")').first();
    this.todayStatsCard = this.root.locator("text=zakazanih termina").first();
    this.upcomingStatsCard = this.root.locator("text=ukupno zakazano").first();
    this.eventTypesStatsCard = this.root.locator("text=aktivnih tipova").first();
    this.eventTypesStatsValue = this.eventTypesStatsCard
      .locator("xpath=preceding-sibling::div")
      .first();
    this.emptyBookingsMessage = this.root.locator("text=Nemate zakazanih termina.").first();
    this.viewAllBookingsButton = this.root
      .locator('a[href="/dashboard/bookings"]:has-text("Vidi sve")')
      .first();
    this.createEventTypeButton = this.root
      .locator('a[href="/dashboard/event-types"]:has-text("Kreiraj tip termina")')
      .first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.DASHBOARD);
    await this.waitForPageLoad();
  }

  async expectWelcomeVisible(): Promise<void> {
    await expect(this.welcomeHeading).toBeVisible();
  }

  async expectStatsCardsVisible(): Promise<void> {
    await expect(this.todayStatsCard).toBeVisible();
    await expect(this.upcomingStatsCard).toBeVisible();
    await expect(this.eventTypesStatsCard).toBeVisible();
  }

  async expectEmptyBookingsState(): Promise<void> {
    await expect(this.emptyBookingsMessage).toBeVisible();
  }

  async expectEventTypesCount(count: string): Promise<void> {
    await expect(this.eventTypesStatsValue).toHaveText(count);
  }

  async expectBookingVisible(attendeeName: string): Promise<void> {
    await expect(this.page.locator(`text=${attendeeName}`)).toBeVisible();
  }
}
