import { getSession } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/mobile-auth/jwt";
import { logger } from "@salonko/config";
import type { Session } from "@salonko/trpc";
import { type Context, appRouter, createTRPCContext } from "@salonko/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

/**
 * Resolve session from either NextAuth cookie (web) or Bearer token (mobile).
 * Mobile clients send `Authorization: Bearer <jwt>` header.
 */
async function resolveSession(req: Request): Promise<Session> {
  // Check for mobile Bearer token first
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (payload) {
      return {
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          salonName: payload.salonName,
        },
      };
    }
  }

  // Fall back to NextAuth session (web)
  const session = await getSession();
  if (session) {
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        salonName: session.user.salonName,
      },
    };
  }

  return null;
}

const handler = async (req: Request) => {
  const session = await resolveSession(req);

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      return createTRPCContext({
        req,
        resHeaders: new Headers(),
        info: {} as never,
        session,
      });
    },
    onError: ({ error, path }) => {
      logger.error("tRPC error", { path, error, code: error.code });
    },
  });
};

export { handler as GET, handler as POST };
