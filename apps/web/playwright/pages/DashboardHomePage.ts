import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

export class DashboardHomePage extends BasePage {
  readonly welcomeHeading: Locator;
  readonly todayStatsCard: Locator;
  readonly upcomingStatsCard: Locator;
  readonly eventTypesStatsCard: Locator;
  readonly emptyBookingsMessage: Locator;
  readonly viewAllBookingsButton: Locator;
  readonly createEventTypeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.welcomeHeading = page.locator('h1:has-text("Dobrodošli")').first();
    // Stats cards identified by their title text within the grid
    this.todayStatsCard = page.locator("text=zakazanih termina").first();
    this.upcomingStatsCard = page.locator("text=ukupno zakazano").first();
    this.eventTypesStatsCard = page.locator("text=aktivnih tipova").first();
    this.emptyBookingsMessage = page.locator("text=Nemate zakazanih termina.").first();
    this.viewAllBookingsButton = page
      .locator('a[href="/dashboard/bookings"]:has-text("Vidi sve")')
      .first();
    this.createEventTypeButton = page
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

  async expectBookingVisible(attendeeName: string): Promise<void> {
    await expect(this.page.locator(`text=${attendeeName}`)).toBeVisible();
  }
}
