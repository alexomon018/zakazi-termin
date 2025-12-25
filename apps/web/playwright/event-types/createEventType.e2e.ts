import { expect, test } from "../fixtures";
import { CreateEventTypePage } from "../pages";

test.describe("Create Event Type", () => {
  test.beforeEach(async ({ users }) => {
    // Create a user with schedule for event type creation
    const user = await users.create({ withSchedule: true });
    await users.login(user);
  });

  test("should display create event type form", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Check form elements are visible
    await expect(createPage.pageTitle).toBeVisible();
    await createPage.expectFormVisible();
  });

  test("should auto-generate slug from title", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Type a title
    await createPage.fillTitle("Konsultacija");

    // Check slug is auto-generated
    await createPage.expectSlugValue("konsultacija");
  });

  test("should handle Serbian characters in slug generation", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Type a title with Serbian characters
    await createPage.fillTitle("Čišćenje zuba");

    // Check slug converts Serbian chars correctly
    await createPage.expectSlugValue("ciscenje-zuba");
  });

  test("should show validation errors for empty required fields", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Submit empty form
    await createPage.submit();

    // Should show validation errors
    await createPage.expectValidationError("Naziv je obavezan");
  });

  test("should show error when address is required but empty", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Fill only title and slug (location type defaults to inPerson)
    await createPage.fillTitle("Test Event");
    await createPage.fillSlug("test-event");

    // Submit form without address
    await createPage.submit();

    // Should show address required error
    await createPage.expectValidationError("Adresa je obavezna za termine uživo");
  });

  test("should create event type successfully", async ({ page, prisma }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    const title = `Test Event ${Date.now()}`;
    const slug = `test-event-${Date.now()}`;
    const address = "Test Address 123, Belgrade";

    // Fill in the form and submit
    await createPage.createEventTypeAndExpectSuccess({
      title,
      slug,
      description: "This is a test event type",
      address,
    });

    // Verify event type was created in database
    const eventType = await prisma.eventType.findFirst({
      where: { slug },
    });
    expect(eventType).toBeTruthy();
    expect(eventType?.title).toBe(title);

    // Cleanup
    if (eventType) {
      await prisma.eventType.delete({ where: { id: eventType.id } });
    }
  });

  test("should allow selecting different duration", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Click on 60 min duration button
    await createPage.selectDuration(60);

    // Verify the duration input has the correct value
    await createPage.expectDurationValue(60);
  });

  test("should have back button to event types list", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Click back button
    await createPage.goBack();

    // Should navigate to event types list
    await expect(page).toHaveURL(/\/dashboard\/event-types$/);
  });

  test("should have cancel button", async ({ page }) => {
    const createPage = new CreateEventTypePage(page);
    await createPage.goto();

    // Click cancel button
    await createPage.cancel();

    // Should navigate to event types list
    await expect(page).toHaveURL(/\/dashboard\/event-types$/);
  });
});
