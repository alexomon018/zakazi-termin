import { expect, test } from "../fixtures";
import { EventTypesListPage } from "../pages";

test.describe("Delete Event Type", () => {
  test("should display event types list", async ({ page, users }) => {
    // Create user with event type
    const user = await users.create({
      withSchedule: true,
      withEventType: true,
    });
    await users.login(user);

    // Navigate to event types list using page object
    const listPage = new EventTypesListPage(page);
    await listPage.goto();

    // Should see the event type
    await listPage.expectEventTypeVisible("30 Minute Meeting");
  });

  test("should show empty state when no event types", async ({ page, users }) => {
    // Create user without event type
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Navigate to event types list using page object
    const listPage = new EventTypesListPage(page);
    await listPage.goto();

    // Should show create button (empty state)
    await expect(listPage.createButton).toBeVisible();
  });

  test("should navigate to create new event type", async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Navigate to event types list using page object
    const listPage = new EventTypesListPage(page);
    await listPage.goto();

    // Click create button
    await listPage.clickCreate();

    // Should navigate to new event type page
    await expect(page).toHaveURL(/\/dashboard\/event-types\/new/);
  });

  test("should delete event type", async ({ page, users, prisma }) => {
    // Create user with event type
    const user = await users.create({
      withSchedule: true,
      withEventType: true,
    });
    await users.login(user);

    // Get the event type
    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id },
    });
    expect(eventType).toBeTruthy();

    // Navigate to event types list using page object
    const listPage = new EventTypesListPage(page);
    await listPage.goto();

    // Delete the event type
    await listPage.deleteEventType("30 Minute Meeting");

    // Wait for the event type to be removed from the list
    await listPage.expectEventTypeHidden("30 Minute Meeting");

    // Verify deletion in database
    const deletedEventType = await prisma.eventType.findUnique({
      where: { id: eventType!.id },
    });

    // The event type should be deleted
    expect(deletedEventType).toBeNull();
  });
});
