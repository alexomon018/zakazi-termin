import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./BasePage";
import { ROUTES } from "../lib/constants";

/**
 * Page Object for the Public User Profile/Booking page
 */
export class PublicProfilePage extends BasePage {
  readonly userName: Locator;
  readonly userBio: Locator;
  readonly eventTypesList: Locator;

  constructor(page: Page) {
    super(page);

    this.userName = page.getByTestId("public-profile-name");
    this.userBio = page.getByTestId("public-profile-bio");
    this.eventTypesList = page.getByTestId("public-event-types-list");
  }

  async goto(username: string): Promise<void> {
    await this.page.goto(ROUTES.publicBookingPage(username));
    await this.waitForPageLoad();
  }

  /**
   * Check if user name is displayed
   */
  async expectUserNameVisible(name: string): Promise<void> {
    await expect(this.page.locator(`text=${name}`)).toBeVisible();
  }

  /**
   * Check if event type is visible
   */
  async expectEventTypeVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }

  /**
   * Get event type card by title
   */
  getEventTypeCard(title: string): Locator {
    return this.page.getByTestId(`public-event-type-${title.toLowerCase().replace(/\s+/g, "-")}`);
  }

  /**
   * Click on an event type to go to booking page
   */
  async selectEventType(title: string): Promise<void> {
    await this.page.locator(`text=${title}`).click();
  }

  /**
   * Check that page is accessible without login (not redirected)
   */
  async expectNotRedirectedToLogin(): Promise<void> {
    await expect(this.page).not.toHaveURL(/\/login/);
  }
}

/**
 * Page Object for the Event Type Booking page (calendar + time slots)
 */
export class EventTypeBookingPage extends BasePage {
  readonly eventTitle: Locator;
  readonly eventDuration: Locator;
  readonly eventLocation: Locator;
  readonly eventDescription: Locator;
  readonly calendar: Locator;
  readonly nextMonthButton: Locator;
  readonly prevMonthButton: Locator;
  readonly monthDisplay: Locator;
  readonly timeSlotsList: Locator;

  // Booking form (after selecting time)
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly notesInput: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    super(page);

    this.eventTitle = page.getByTestId("booking-event-title");
    this.eventDuration = page.getByTestId("booking-event-duration");
    this.eventLocation = page.getByTestId("booking-event-location");
    this.eventDescription = page.getByTestId("booking-event-description");
    this.calendar = page.getByTestId("booking-calendar");
    this.nextMonthButton = page.getByTestId("calendar-next-month");
    this.prevMonthButton = page.getByTestId("calendar-prev-month");
    this.monthDisplay = page.getByTestId("calendar-month-display");
    this.timeSlotsList = page.getByTestId("time-slots-list");

    this.nameInput = page.getByTestId("booking-name-input");
    this.emailInput = page.getByTestId("booking-email-input");
    this.notesInput = page.getByTestId("booking-notes-input");
    this.confirmButton = page.getByTestId("booking-confirm-button");
  }

  async goto(username: string, eventSlug: string): Promise<void> {
    await this.page.goto(ROUTES.publicEventType(username, eventSlug));
    await this.waitForPageLoad();
  }

  /**
   * Check if event details are displayed
   */
  async expectEventDetailsVisible(): Promise<void> {
    await expect(this.eventTitle).toBeVisible();
  }

  /**
   * Check if duration is displayed
   */
  async expectDurationVisible(): Promise<void> {
    // Look for duration text (e.g., "30 minuta" or "minuta")
    await expect(this.page.locator("text=minuta").first()).toBeVisible();
  }

  /**
   * Check if location is displayed
   */
  async expectLocationVisible(address: string): Promise<void> {
    await expect(this.page.locator(`text=${address}`)).toBeVisible();
  }

  /**
   * Navigate to next month
   */
  async goToNextMonth(): Promise<void> {
    await this.clickButton(this.nextMonthButton);
    // Wait for calendar to update
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to previous month
   */
  async goToPreviousMonth(): Promise<void> {
    await this.clickButton(this.prevMonthButton);
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Select a date in the calendar
   */
  async selectDate(day: number): Promise<void> {
    const dateButton = this.page.getByTestId(`calendar-day-${day}`);
    await this.clickButton(dateButton);
  }

  /**
   * Get available time slots
   */
  getTimeSlots(): Locator {
    return this.page.getByTestId("time-slot");
  }

  /**
   * Select a time slot
   */
  async selectTimeSlot(index: number = 0): Promise<void> {
    const slots = this.getTimeSlots();
    await slots.nth(index).click();
  }

  /**
   * Fill booking form
   */
  async fillBookingForm(data: {
    name: string;
    email: string;
    notes?: string;
  }): Promise<void> {
    await this.fillField(this.nameInput, data.name);
    await this.fillField(this.emailInput, data.email);
    if (data.notes) {
      await this.fillField(this.notesInput, data.notes);
    }
  }

  /**
   * Confirm the booking
   */
  async confirmBooking(): Promise<void> {
    await this.waitForMutation(async () => {
      await this.clickButton(this.confirmButton);
    });
  }

  /**
   * Complete the full booking flow
   */
  async completeBooking(data: {
    day: number;
    timeSlotIndex?: number;
    name: string;
    email: string;
    notes?: string;
  }): Promise<void> {
    await this.selectDate(data.day);
    await this.selectTimeSlot(data.timeSlotIndex || 0);
    await this.fillBookingForm({
      name: data.name,
      email: data.email,
      notes: data.notes,
    });
    await this.confirmBooking();
  }

  /**
   * Check if time slots are visible
   */
  async expectTimeSlotsVisible(): Promise<void> {
    const slots = this.getTimeSlots();
    await expect(slots.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Check if calendar is visible
   */
  async expectCalendarVisible(): Promise<void> {
    const hasCalendar = await this.isVisible(this.calendar) ||
      await this.page.locator('[role="grid"]').isVisible().catch(() => false);
    expect(hasCalendar).toBeTruthy();
  }
}

/**
 * Page Object for the Booking Confirmation success page
 */
export class BookingConfirmationPage extends BasePage {
  readonly successMessage: Locator;
  readonly eventTitle: Locator;
  readonly dateTime: Locator;
  readonly location: Locator;
  readonly addToCalendarButton: Locator;

  constructor(page: Page) {
    super(page);

    this.successMessage = page.getByTestId("booking-success-message");
    this.eventTitle = page.getByTestId("booking-confirmation-title");
    this.dateTime = page.getByTestId("booking-confirmation-datetime");
    this.location = page.getByTestId("booking-confirmation-location");
    this.addToCalendarButton = page.getByTestId("add-to-calendar-button");
  }

  async goto(bookingUid: string): Promise<void> {
    await this.page.goto(ROUTES.bookingDetails(bookingUid));
    await this.waitForPageLoad();
  }

  /**
   * Check if booking confirmation is displayed
   */
  async expectConfirmationVisible(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Check if event title is displayed
   */
  async expectEventTitle(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }
}
