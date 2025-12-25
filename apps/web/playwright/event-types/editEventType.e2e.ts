import { expect, test } from "../fixtures";
import { EditEventTypePage } from "../pages";

test.describe("Edit Event Type", () => {
  test("should display edit form with existing data", async ({ page, users, prisma }) => {
    // Create user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });
    await users.login(user);

    // Get the created event type
    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id },
    });
    expect(eventType).toBeTruthy();

    // Navigate to edit page using page object
    const editPage = new EditEventTypePage(page);
    await editPage.goto(eventType!.id);

    // Check that form is populated with existing data
    await editPage.expectFormPopulated({
      title: eventType!.title,
      slug: eventType!.slug,
    });
  });

  test("should update event type successfully", async ({ page, users, prisma }) => {
    // Create user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });
    await users.login(user);

    // Get the created event type
    const eventType = await prisma.eventType.findFirst({
      where: { userId: user.id },
    });
    expect(eventType).toBeTruthy();

    // Navigate to edit page using page object
    const editPage = new EditEventTypePage(page);
    await editPage.goto(eventType!.id);

    // Update the title
    const newTitle = `Updated Event ${Date.now()}`;
    await editPage.updateTitle(newTitle);

    // Fill required location address field
    await editPage.updateLocationAddress("Test Address 123");

    // Save changes
    await editPage.save();

    // Verify update in database
    const updatedEventType = await prisma.eventType.findUnique({
      where: { id: eventType!.id },
    });
    expect(updatedEventType?.title).toBe(newTitle);
  });

  test("should show error for duplicate slug", async ({ page, users, prisma }) => {
    // Create user with schedule
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Get the user's default schedule
    const userWithSchedule = await prisma.user.findUnique({
      where: { id: user.id },
      select: { defaultScheduleId: true },
    });

    // Create two event types
    const eventType1 = await prisma.eventType.create({
      data: {
        userId: user.id,
        title: "Event 1",
        slug: "event-1",
        length: 30,
        scheduleId: userWithSchedule?.defaultScheduleId,
      },
    });

    const eventType2 = await prisma.eventType.create({
      data: {
        userId: user.id,
        title: "Event 2",
        slug: "event-2",
        length: 30,
        scheduleId: userWithSchedule?.defaultScheduleId,
      },
    });

    // Navigate to edit page for event 2 using page object
    const editPage = new EditEventTypePage(page);
    await editPage.goto(eventType2.id);

    // Try to change slug to existing one
    await editPage.updateSlug("event-1");

    // Fill required location address field
    await editPage.updateLocationAddress("Test Address 123");

    // Submit form
    await editPage.submit();

    // Should show error about duplicate slug
    await editPage.expectDuplicateSlugError();

    // Cleanup
    await prisma.eventType.deleteMany({
      where: { id: { in: [eventType1.id, eventType2.id] } },
    });
  });
});
