import { expect, test } from "../fixtures";
import { DashboardHomePage } from "../pages";

test.describe("Dashboard Home", () => {
  test.beforeEach(async ({ users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
  });

  test("should display welcome heading", async ({ page }) => {
    const dashboardPage = new DashboardHomePage(page);
    await dashboardPage.goto();

    await dashboardPage.expectWelcomeVisible();
  });

  test("should display stats cards", async ({ page }) => {
    const dashboardPage = new DashboardHomePage(page);
    await dashboardPage.goto();

    await dashboardPage.expectStatsCardsVisible();
  });

  test("should show empty bookings state when no bookings", async ({ page }) => {
    const dashboardPage = new DashboardHomePage(page);
    await dashboardPage.goto();

    await dashboardPage.expectEmptyBookingsState();
  });

  test("should display upcoming booking when exists", async ({ page, prisma, users }) => {
    // This test needs a user with an event type to create a booking
    const user = await users.create({ withSchedule: true, withEventType: true });
    await users.login(user);

    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id },
    });
    expect(eventType).toBeTruthy();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);

    await prisma.booking.create({
      data: {
        userId: user.id,
        eventTypeId: eventType!.id,
        title: eventType!.title,
        startTime: tomorrow,
        endTime: endTime,
        status: "ACCEPTED",
        attendees: {
          create: {
            name: "Dashboard Test Attendee",
            email: "dashboard-attendee@test.com",
            timeZone: "Europe/Belgrade",
          },
        },
      },
    });

    const dashboardPage = new DashboardHomePage(page);
    await dashboardPage.goto();

    await dashboardPage.expectBookingVisible("Dashboard Test Attendee");
  });

  test("should show event types stats card with event type", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true, withEventType: true });
    await users.login(user);

    const dashboardPage = new DashboardHomePage(page);
    await dashboardPage.goto();

    // With one event type created, the stats card should be visible
    await expect(dashboardPage.eventTypesStatsCard).toBeVisible();
  });
});
