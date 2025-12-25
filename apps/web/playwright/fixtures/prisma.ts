import { test as base } from "@playwright/test";
import { PrismaClient } from "@zakazi-termin/prisma";

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
  prisma: async (_fixtures, use) => {
    const prisma = getPrismaClient();
    await use(prisma);
  },
});
