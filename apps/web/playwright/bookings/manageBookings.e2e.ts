import { expect, test } from "../fixtures";
import { BookingsPage } from "../pages";

test.describe("Manage Bookings", () => {
  test("should display bookings page", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Navigate to bookings page using page object
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.goto();

    // Should see the bookings page header "Termini"
    await expect(bookingsPage.pageTitle).toBeVisible();
  });

  test("should show empty state when no bookings", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Navigate to bookings page using page object
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.goto();

    // Should show empty state message
    await bookingsPage.expectEmptyState();
  });

  test("should display booking when exists", async ({ page, users, prisma }) => {
    // Create user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });

    // Get the event type
    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id },
    });

    // Create a booking
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        eventTypeId: eventType!.id,
        title: eventType!.title,
        startTime: tomorrow,
        endTime: endTime,
        status: "ACCEPTED",
        attendees: {
          create: {
            name: "Test Attendee",
            email: "attendee@test.com",
            timeZone: "Europe/Belgrade",
          },
        },
      },
    });

    // Login and navigate to bookings using page object
    await users.login(user);
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.goto();

    // Should see the booking
    await bookingsPage.expectBookingVisible("Test Attendee");

    // Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
  });

  test("should have filter tabs", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Navigate to bookings page using page object
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.goto();

    // Should have filter options
    await bookingsPage.expectFilterTabsVisible();
  });
});
