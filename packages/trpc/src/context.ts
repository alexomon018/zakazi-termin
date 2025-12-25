import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { prisma } from "@zakazi-termin/prisma";

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

/**
 * Inner context - framework independent, used for server components and testing
 * This doesn't need HTTP request/response objects
 */
export type CreateInnerContextOptions = {
  session: Session;
};

export function createContextInner(opts: CreateInnerContextOptions): Context {
  return {
    prisma,
    session: opts.session,
  };
}

/**
 * Outer context - used for API routes with HTTP objects
 */
export async function createTRPCContext(
  opts?: FetchCreateContextFnOptions & { session?: Session }
): Promise<Context> {
  return createContextInner({
    session: opts?.session ?? null,
  });
}
