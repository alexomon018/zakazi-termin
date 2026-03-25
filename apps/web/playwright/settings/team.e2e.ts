import type { PrismaClient } from "@salonko/prisma";
import { expect, test } from "../fixtures";
import type { TestUser } from "../fixtures/users";
import { TeamSettingsPage } from "../pages";

async function createOrgWithOwner(prisma: PrismaClient, user: TestUser) {
  return prisma.organization.create({
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
}

test.describe("Team Settings", () => {
  test.beforeEach(async ({ page, users }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);
    await page.context().addCookies([
      {
        name: "cookie-consent",
        value: JSON.stringify({
          version: 1,
          necessary: true,
          analytics: false,
          timestamp: Date.now(),
        }),
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  test("should display team settings page", async ({ page }) => {
    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await teamPage.expectPageVisible();
  });

  test("should show create organization when no org exists", async ({ page }) => {
    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await teamPage.expectCreateOrganizationVisible();
  });
});

test.describe("Team Settings - With Organization", () => {
  test("should show team page after organization is created", async ({ page, users, prisma }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    const org = await createOrgWithOwner(prisma, user);

    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await expect(teamPage.pageTitle).toBeVisible();
    await teamPage.expectCurrentUserInList(user.name);

    await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });

  test("should show invite actions for owner", async ({ page, users, prisma }) => {
    const user = await users.create({ withSchedule: true });
    await users.login(user);

    const org = await createOrgWithOwner(prisma, user);

    const teamPage = new TeamSettingsPage(page);
    await teamPage.goto();

    await teamPage.expectInviteActionsVisible();

    await prisma.membership.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });
});
