import { type Page, test as base } from "@playwright/test";
import { PrismaClient } from "@salonko/prisma";
import { hash } from "bcryptjs";

export interface TestUser {
  id: number;
  email: string;
  password: string;
  username: string;
  name: string;
}

export interface CreateUserOptions {
  email?: string;
  password?: string;
  username?: string;
  name?: string;
  withSchedule?: boolean;
  withEventType?: boolean;
}

export interface UsersFixture {
  create: (options?: CreateUserOptions) => Promise<TestUser>;
  login: (user: TestUser) => Promise<void>;
  deleteAll: () => Promise<void>;
}

export type UsersFixtureType = {
  users: UsersFixture;
};

// Keep track of created users for cleanup
const createdUserIds: number[] = [];
let userCounter = 0;

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

    const users: UsersFixture = {
      create: async (options: CreateUserOptions = {}): Promise<TestUser> => {
        userCounter++;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        const email = options.email || `test-user-${timestamp}-${userCounter}-${random}@test.com`;
        const password = options.password || "TestPassword123!";
        const username = options.username || `testuser${timestamp}${userCounter}${random}`;
        const name = options.name || `Test User ${userCounter}`;

        // Hash password
        const passwordHash = await hash(password, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            username,
            name,
            identityProvider: "EMAIL",
            emailVerified: new Date(),
            password: {
              create: {
                hash: passwordHash,
              },
            },
          },
        });

        createdUserIds.push(user.id);

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
          username,
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

async function loginUser(page: Page, user: TestUser): Promise<void> {
  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials (using id selectors to match the actual form)
  await page.fill('input[id="email"]', user.email);
  await page.fill('input[id="password"]', user.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}
