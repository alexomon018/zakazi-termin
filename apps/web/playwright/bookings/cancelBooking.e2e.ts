import { test, expect } from "../fixtures";
import { BookingsPage, BookingDetailsPage } from "../pages";
import { ROUTES } from "../lib/constants";

test.describe("Cancel Booking", () => {
  test("should allow cancelling a booking", async ({ page, users, prisma }) => {
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
            name: "Cancel Test Attendee",
            email: "cancel-test@test.com",
            timeZone: "Europe/Belgrade",
          },
        },
      },
    });

    // Login and navigate to bookings using page object
    await users.login(user);
    const bookingsPage = new BookingsPage(page);
    await bookingsPage.goto();

    // Cancel the booking using page object
    await bookingsPage.cancelBooking("Cancel Test Attendee");

    // Verify booking is cancelled in database
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
    });

    // Note: Depending on implementation, booking might be deleted or status changed
    if (updatedBooking) {
      expect(updatedBooking.status).toBe("CANCELLED");
    }

    // Cleanup if not deleted
    if (updatedBooking) {
      await prisma.booking.delete({ where: { id: booking.id } });
    }
  });

  test("should show booking confirmation page", async ({
    page,
    users,
    prisma,
  }) => {
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
            name: "View Test Attendee",
            email: "view-test@test.com",
            timeZone: "Europe/Belgrade",
          },
        },
      },
    });

    // Navigate to booking confirmation page using page object
    const detailsPage = new BookingDetailsPage(page);
    await detailsPage.goto(booking.uid);

    // Should see booking details
    await detailsPage.expectBookingDetails(eventType!.title);

    // Cleanup
    await prisma.booking.delete({ where: { id: booking.id } });
  });
});
