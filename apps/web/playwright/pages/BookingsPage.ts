import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Bookings list page
 */
export class BookingsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly upcomingTab: Locator;
  readonly pastTab: Locator;
  readonly cancelledTab: Locator;
  readonly emptyState: Locator;
  readonly bookingsList: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors with fallbacks
    this.pageTitle = page
      .locator('[data-testid="bookings-title"]')
      .or(page.locator('h1:has-text("Termini")'))
      .first();
    this.upcomingTab = page
      .locator('[data-testid="bookings-tab-upcoming"]')
      .or(page.getByText(/predstoje/i))
      .first();
    this.pastTab = page
      .locator('[data-testid="bookings-tab-past"]')
      .or(page.getByText(/prošli/i))
      .first();
    this.cancelledTab = page.locator('[data-testid="bookings-tab-cancelled"]');
    this.emptyState = page
      .locator('[data-testid="bookings-empty-state"]')
      .or(page.getByText(/nema|prazno/i))
      .first();
    this.bookingsList = page.locator('[data-testid="bookings-list"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.BOOKINGS);
    await this.waitForPageLoad();
  }

  /**
   * Switch to upcoming bookings tab
   */
  async showUpcoming(): Promise<void> {
    await this.clickButton(this.upcomingTab);
  }

  /**
   * Switch to past bookings tab
   */
  async showPast(): Promise<void> {
    await this.clickButton(this.pastTab);
  }

  /**
   * Switch to cancelled bookings tab
   */
  async showCancelled(): Promise<void> {
    await this.clickButton(this.cancelledTab);
  }

  /**
   * Get a booking card by attendee name
   */
  getBookingCard(attendeeName: string): Locator {
    return this.page.getByTestId(`booking-card-${attendeeName.toLowerCase().replace(/\s+/g, "-")}`);
  }

  /**
   * Check if a booking with given attendee is visible
   */
  async expectBookingVisible(attendeeName: string): Promise<void> {
    await expect(this.page.locator(`text=${attendeeName}`)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Cancel a booking by attendee name
   */
  async cancelBooking(attendeeName: string): Promise<void> {
    // Wait for the attendee to be visible first
    await this.expectBookingVisible(attendeeName);

    // Click the "Otkaži" (Cancel) button
    const cancelButton = this.page.locator("button:has-text('Otkaži')").first();
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
    await cancelButton.click();

    // Confirm cancellation in the dialog (button says "Otkaži termin")
    const confirmButton = this.page.locator("button:has-text('Otkaži termin')");
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await this.waitForMutation(async () => {
      await confirmButton.click();
    });
  }

  /**
   * Check if empty state is displayed
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for a specific booking to appear
   */
  async waitForBooking(attendeeName: string): Promise<void> {
    await expect(this.page.locator(`text=${attendeeName}`)).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if filter tabs are visible
   */
  async expectFilterTabsVisible(): Promise<void> {
    const hasUpcomingTab = await this.upcomingTab.isVisible().catch(() => false);
    const hasPastTab = await this.pastTab.isVisible().catch(() => false);
    expect(hasUpcomingTab || hasPastTab).toBeTruthy();
  }
}

/**
 * Page Object for the Booking Details/Confirmation page
 */
export class BookingDetailsPage extends BasePage {
  readonly pageTitle: Locator;
  readonly eventTitle: Locator;
  readonly dateTime: Locator;
  readonly attendeeName: Locator;
  readonly attendeeEmail: Locator;
  readonly location: Locator;
  readonly cancelButton: Locator;
  readonly rescheduleButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('[data-testid="booking-details-title"]').first();
    this.eventTitle = page.locator('[data-testid="booking-event-title"]').first();
    this.dateTime = page.locator('[data-testid="booking-datetime"]').first();
    this.attendeeName = page.locator('[data-testid="booking-attendee-name"]').first();
    this.attendeeEmail = page.locator('[data-testid="booking-attendee-email"]').first();
    this.location = page.locator('[data-testid="booking-location"]').first();
    this.cancelButton = page.locator('[data-testid="booking-cancel-button"]').first();
    this.rescheduleButton = page.locator('[data-testid="booking-reschedule-button"]').first();
  }

  async goto(bookingUid: string): Promise<void> {
    await this.page.goto(ROUTES.bookingDetails(bookingUid));
    await this.waitForPageLoad();
  }

  /**
   * Check if booking details are displayed
   */
  async expectBookingDetails(eventTitle: string): Promise<void> {
    await expect(this.page.locator(`text=${eventTitle}`)).toBeVisible();
  }

  /**
   * Cancel this booking
   */
  async cancel(): Promise<void> {
    await this.clickButton(this.cancelButton);

    const confirmButton = this.page.getByTestId("confirm-cancel-booking-button");
    await expect(confirmButton).toBeVisible();
    await this.waitForMutation(async () => {
      await this.clickButton(confirmButton);
    });
  }
}
