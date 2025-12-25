import { mergeTests } from "@playwright/test";
import { type PrismaFixture, test as prismaTest } from "./prisma";
import { type UsersFixtureType, test as usersTest } from "./users";

export type { TestUser, CreateUserOptions, UsersFixture } from "./users";
export type { PrismaFixture } from "./prisma";

// Merge all fixtures into a single test object
export const test = mergeTests(prismaTest, usersTest);

// Re-export expect from playwright
export { expect } from "@playwright/test";

// Combined fixture type for TypeScript
export type Fixtures = PrismaFixture & UsersFixtureType;
