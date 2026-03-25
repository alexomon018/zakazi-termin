import { type Page, test as base } from "@playwright/test";
import { PrismaClient } from "@salonko/prisma";
import { hash } from "bcryptjs";

export interface TestUser {
  id: string;
  email: string;
  password: string;
  salonName: string;
  salonSlug: string;
  name: string;
}

/**
 * Generate a URL-safe slug from a salon name.
 * Mirrors `generateSalonSlug` from `@salonko/config` to avoid cross-package imports.
 */
function toSalonSlug(salonName: string): string {
  return salonName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "dj")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim()
    .slice(0, 30);
}

export interface CreateUserOptions {
  email?: string;
  password?: string;
  salonName?: string;
  name?: string;
  withSchedule?: boolean;
  withEventType?: boolean;
  /** Auto-create a trial subscription (defaults to true). Set to false for payment tests that manage subscriptions explicitly. */
  withTrial?: boolean;
}

export interface UsersFixture {
  create: (options?: CreateUserOptions) => Promise<TestUser>;
  login: (user: TestUser) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export type UsersFixtureType = {
  users: UsersFixture;
};

// Shared Prisma instance
let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export const test = base.extend<UsersFixtureType>({
  users: async ({ page }, use) => {
    const prisma = getPrismaClient();
    // Per-test tracking to avoid cross-test contamination
    const createdUserIds: string[] = [];
    let userCounter = 0;

    const users: UsersFixture = {
      create: async (options: CreateUserOptions = {}): Promise<TestUser> => {
        userCounter++;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const email = options.email || `test-user-${timestamp}-${userCounter}-${random}@test.com`;
        const password = options.password || "TestPassword123!";
        // Limit salon name to 30 characters to pass validation
        const salonName = options.salonName || `salon${userCounter}${random}`.slice(0, 30);
        const salonSlug = toSalonSlug(salonName);
        const name = options.name || `Test User ${userCounter}`;

        // Hash password
        const passwordHash = await hash(password, 12);

        // Create user with complete profile to skip onboarding redirect
        const user = await prisma.user.create({
          data: {
            email,
            salonName,
            salonSlug,
            name,
            identityProvider: "EMAIL",
            emailVerified: new Date(),
            salonTypes: ["frizerski_salon"],
            salonCity: "Beograd",
            salonAddress: "Testna Ulica 1",
            password: {
              create: {
                hash: passwordHash,
              },
            },
          },
        });

        createdUserIds.push(user.id);

        // Auto-create trial subscription (defaults to true)
        if (options.withTrial !== false) {
          const now = new Date();
          const trialEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await prisma.subscription.create({
            data: {
              userId: user.id,
              stripeCustomerId: `cus_test_${timestamp}_${userCounter}_${random}`,
              status: "TRIALING",
              trialStartedAt: now,
              trialEndsAt,
            },
          });
        }

        // Create default schedule if requested
        if (options.withSchedule) {
          const schedule = await prisma.schedule.create({
            data: {
              userId: user.id,
              name: "Working Hours",
              timeZone: "Europe/Belgrade",
              availability: {
                create: [
                  // Monday to Friday, 9:00 - 17:00
                  {
                    days: [1, 2, 3, 4, 5],
                    startTime: new Date("1970-01-01T09:00:00.000Z"),
                    endTime: new Date("1970-01-01T17:00:00.000Z"),
                    userId: user.id,
                  },
                ],
              },
            },
          });

          // Set as default schedule
          await prisma.user.update({
            where: { id: user.id },
            data: { defaultScheduleId: schedule.id },
          });

          // Create event type if requested
          if (options.withEventType) {
            await prisma.eventType.create({
              data: {
                userId: user.id,
                title: "30 Minute Meeting",
                slug: "30-minute-meeting",
                length: 30,
                scheduleId: schedule.id,
              },
            });
          }
        }

        return {
          id: user.id,
          email,
          password,
          salonName,
          salonSlug,
          name,
        };
      },

      login: async (user: TestUser): Promise<void> => {
        await loginUser(page, user);
      },

      deleteAll: async (): Promise<void> => {
        if (createdUserIds.length > 0) {
          await prisma.user.deleteMany({
            where: {
              id: { in: createdUserIds },
            },
          });
          createdUserIds.length = 0;
        }
      },
    };

    await use(users);

    // Cleanup after each test
    await users.deleteAll();
  },
});

async function loginUser(page: Page, user: TestUser, retries = 2): Promise<void> {
  // Clear existing session to avoid middleware redirecting away from /login
  await page.context().clearCookies();

  // Set cookie consent before navigating to avoid banner blocking interactions
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

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Navigate to login page and wait for hydration to complete
    await page.goto("/login", { waitUntil: "networkidle" });

    // Fill in credentials
    await page.fill('input[id="email"]', user.email);
    await page.fill('input[id="password"]', user.password);

    // Start listening for the auth response before clicking submit.
    // This ensures the session cookie is set before we check for navigation.
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/auth/") && res.request().method() === "POST",
      { timeout: 30000 }
    );
    await page.click('button[type="submit"]');
    await responsePromise;

    try {
      // Wait for navigation to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      // Wait for all pending client-side navigations (router.refresh, etc.) to settle
      // so subsequent page.goto() calls are not interrupted
      await page.waitForLoadState("networkidle");
      return;
    } catch {
      // If stuck on login page, the client-side router.push may have failed
      // but the session cookie should be set — try direct navigation
      if (page.url().includes("/login")) {
        await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
        try {
          await page.waitForURL(/\/dashboard/, { timeout: 10000 });
          return;
        } catch {
          // Fall through to retry
        }
      }

      if (attempt === retries) {
        throw new Error(
          `Login failed after ${retries + 1} attempts for user ${user.email}. Page URL: ${page.url()}`
        );
      }
      // Clear state and retry
      await page.context().clearCookies();
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
    }
  }
}
