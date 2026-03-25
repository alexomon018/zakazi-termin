import { expect, test } from "../fixtures";
import { TeamSettingsPage } from "../pages";

test.describe("Team Settings", () => {
  test.beforeEach(async ({ users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
  });

  test("should display team settings page", async ({ page }) => {
    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await teamPage.expectPageVisible();
  });

  test("should show create organization when no org exists", async ({ page }) => {
    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    // New users without organization should see create org UI
    await teamPage.expectCreateOrganizationVisible();
  });
});

test.describe("Team Settings - With Organization", () => {
  test("should show team page after organization is created", async ({ page, users, prisma }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    // Create organization for this user
    const org = await prisma.organization.create({
      data: {
        name: user.salonName,
        slug: user.salonSlug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            accepted: true,
          },
        },
      },
    });

    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    // Should see team title
    await expect(teamPage.pageTitle).toBeVisible();

    // Should see current user in the members list
    await teamPage.expectCurrentUserInList(user.name);

    // Cleanup
    await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });

  test("should show invite actions for owner", async ({ page, users, prisma }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    const org = await prisma.organization.create({
      data: {
        name: user.salonName,
        slug: user.salonSlug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            accepted: true,
          },
        },
      },
    });

    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await teamPage.expectInviteActionsVisible();

    // Cleanup
    await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
