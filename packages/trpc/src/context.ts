import { prisma } from "@salonko/prisma";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export type Session = {
  user: {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
  };
} | null;

export type Context = {
  prisma: typeof prisma;
  session: Session;
  /**
   * Optional incoming request (available in API route handlers).
   * Used for building absolute URLs from the actual host (custom domains, previews).
   */
  req?: Request;
};

/**
 * Inner context - framework independent, used for server components and testing
 * This doesn't need HTTP request/response objects
 */
export type CreateInnerContextOptions = {
  session: Session;
  req?: Request;
};

export function createContextInner(opts: CreateInnerContextOptions): Context {
  return {
    prisma,
    session: opts.session,
    req: opts.req,
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
    req: opts?.req,
  });
}
