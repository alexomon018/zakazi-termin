import { prisma } from "@zakazi-termin/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export type Session = {
  user: {
    id: number;
    email: string;
    name?: string | null;
    username?: string | null;
  };
} | null;

export type Context = {
  prisma: typeof prisma;
  session: Session;
};

export async function createTRPCContext(
  opts?: FetchCreateContextFnOptions & { session?: Session }
): Promise<Context> {
  return {
    prisma,
    session: opts?.session ?? null,
  };
}
