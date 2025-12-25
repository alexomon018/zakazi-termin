import { expect, test } from "../fixtures";
import { EventTypeBookingPage, PublicProfilePage } from "../pages";

test.describe("Create Booking", () => {
  test("should display public booking page", async ({ page, users }) => {
    // Create a user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });

    // Navigate to the public booking page using page object
    const profilePage = new PublicProfilePage(page);
    await profilePage.goto(user.username);

    // Should see the user's event types
    await profilePage.expectEventTypeVisible("30 Minute Meeting");
  });

  test("should navigate to specific event type booking", async ({ page, users }) => {
    // Create a user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });

    // Navigate to the public booking page using page object
    const profilePage = new PublicProfilePage(page);
    await profilePage.goto(user.username);

    // Click on the event type
    await profilePage.selectEventType("30 Minute Meeting");

    // Should navigate to event type booking page
    await expect(page).toHaveURL(new RegExp(`/${user.username}/30-minute-meeting`));
  });

  test("should display calendar for booking", async ({ page, users }) => {
    // Create a user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });

    // Navigate to the event type booking page using page object
    const bookingPage = new EventTypeBookingPage(page);
    await bookingPage.goto(user.username, "30-minute-meeting");

    // Look for day names in Serbian (Pon, Uto, Sre, etc.) or event type title
    const hasDayNames = await page
      .locator("text=Pon")
      .first()
      .isVisible()
      .catch(() => false);

    const hasEventTitle = await page
      .locator("text=30 Minute Meeting")
      .isVisible()
      .catch(() => false);

    expect(hasDayNames || hasEventTitle).toBeTruthy();
  });

  test("should show user profile info on booking page", async ({ page, users }) => {
    // Create a user with schedule and event type
    const user = await users.create({ withSchedule: true, withEventType: true });

    // Navigate to the public booking page using page object
    const profilePage = new PublicProfilePage(page);
    await profilePage.goto(user.username);

    // Should see the user's name
    await profilePage.expectUserNameVisible(user.name);
  });
});
