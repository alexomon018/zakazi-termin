import "server-only";

import { cache } from "react";
import {
  appRouter,
  createCallerFactory,
  createContextInner,
  type Session,
} from "@zakazi-termin/trpc";
import { getServerSession } from "next-auth";
import { authOptions } from "@zakazi-termin/auth";

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
          id: session.user.id as number,
          email: session.user.email!,
          name: session.user.name,
          username: (session.user as { username?: string }).username,
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
