import { test as base } from "@playwright/test";
import { PrismaClient } from "@salonko/prisma";

export type PrismaFixture = {
  prisma: PrismaClient;
};

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export const test = base.extend<PrismaFixture>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures require object destructuring syntax
  prisma: async ({}, use) => {
    const prisma = getPrismaClient();
    await use(prisma);
  },
});
