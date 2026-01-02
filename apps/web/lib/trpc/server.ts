import "server-only";

import { authOptions } from "@salonko/auth";
import {
  type Session,
  appRouter,
  createCallerFactory,
  createContextInner,
} from "@salonko/trpc";
import { getServerSession } from "next-auth";
import { cache } from "react";

/**
 * Create a server-side tRPC caller
 * This is cached per-request using React's cache function
 */
const createCaller = createCallerFactory(appRouter);

export const createServerCaller = cache(async () => {
  const session = await getServerSession(authOptions);

  const trpcSession: Session = session?.user
    ? {
        user: {
          id: session.user.id as string,
          email: session.user.email!,
          name: session.user.name,
          salonName: (session.user as { salonName?: string }).salonName,
        },
      }
    : null;

  return createCaller(createContextInner({ session: trpcSession }));
});

/**
 * Create a public server-side tRPC caller (no session required)
 * Used for public pages that don't need authentication
 */
export const createPublicServerCaller = cache(async () => {
  return createCaller(createContextInner({ session: null }));
});
