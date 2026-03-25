import { expect, test } from "../fixtures";
import { EventTypeBookingPage, PublicProfilePage } from "../pages";

test.describe.configure({ mode: "serial" });

test.describe("Complete Booking Flow", () => {
  test("should show time slots after selecting a date", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });

    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.goto(user.salonName, "30-minute-meeting");

    // Find the next available weekday (Mon-Fri) to ensure schedule has slots
    const nextWeekday = getNextWeekday();
    await bookingPage.selectDate(nextWeekday);

    await bookingPage.expectTimeSlotsVisible();
  });

  test("should show booking form after selecting a time slot", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });

    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.goto(user.salonName, "30-minute-meeting");

    const nextWeekday = getNextWeekday();
    await bookingPage.selectDate(nextWeekday);
    await bookingPage.expectTimeSlotsVisible();
    await bookingPage.selectTimeSlot(0);

    await expect(bookingPage.nameInput).toBeVisible({ timeout: 10000 });
    await expect(bookingPage.emailInput).toBeVisible();
    await expect(bookingPage.confirmButton).toBeVisible();
  });

  test("should complete full booking and show confirmation", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });

    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.goto(user.salonName, "30-minute-meeting");

    const nextWeekday = getNextWeekday();
    await bookingPage.completeBooking({
      day: nextWeekday,
      name: "Test Attendee",
      email: `attendee-${Date.now()}@test.com`,
      notes: "Test booking notes",
    });

    // Should show confirmation or redirect to booking details
    await expect(
      page
        .locator("text=potvrđen")
        .or(page.locator("text=zakazan"))
        .or(page.getByTestId("booking-success-message"))
    ).toBeVisible({ timeout: 15000 });
  });

  test("should verify booking exists in database after creation", async ({
    page,
    users,
    prisma,
  }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });

    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.goto(user.salonName, "30-minute-meeting");

    const attendeeEmail = `booking-verify-${Date.now()}@test.com`;
    const nextWeekday = getNextWeekday();

    await bookingPage.completeBooking({
      day: nextWeekday,
      name: "Verify User",
      email: attendeeEmail,
    });

    // Wait for confirmation before querying DB
    await expect(
      page
        .locator("text=potvrđen")
        .or(page.locator("text=zakazan"))
        .or(page.getByTestId("booking-success-message"))
    ).toBeVisible({ timeout: 15000 });

    try {
      // Verify booking exists in database
      const attendee = await prisma.attendee.findFirst({
        where: { email: attendeeEmail },
        include: { booking: true },
      });

      expect(attendee).toBeTruthy();
      expect(attendee?.booking).toBeTruthy();
      expect(attendee?.booking?.status).toBe("ACCEPTED");
    } finally {
      // Clean up created booking and attendee records
      const attendee = await prisma.attendee.findFirst({
        where: { email: attendeeEmail },
        select: { id: true, bookingId: true },
      });
      if (attendee) {
        await prisma.attendee.delete({ where: { id: attendee.id } });
        await prisma.booking.delete({ where: { id: attendee.bookingId } });
      }
    }
  });

  test("should navigate from public profile to booking page", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });

    const profilePage = new PublicProfilePage(page);
    await profilePage.goto(user.salonName);
    await profilePage.expectEventTypeVisible("30 Minute Meeting");
    await profilePage.selectEventType("30 Minute Meeting");

    await page.waitForURL(`**/${user.salonName}/30-minute-meeting`, { timeout: 10000 });

    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.expectEventDetailsVisible();
  });
});

/** Returns the day-of-month of the next weekday (Mon-Fri) that is at least 2 days from now. */
function getNextWeekday(): number {
  const now = new Date();
  // Start from 2 days ahead to respect minimumBookingNotice (default 120 min)
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 2);

  // Advance until we hit a weekday
  while (candidate.getDay() === 0 || candidate.getDay() === 6) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.getDate();
}
