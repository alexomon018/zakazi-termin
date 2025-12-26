import { getSession } from "@/lib/auth";
import { logger } from "@salonko/config";
import { type Context, appRouter, createTRPCContext } from "@salonko/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = async (req: Request) => {
  const session = await getSession();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      const trpcSession = session
        ? {
            user: {
              id: Number(session.user.id),
              email: session.user.email,
              name: session.user.name,
              username: session.user.username,
            },
          }
        : null;

      return createTRPCContext({
        req,
        resHeaders: new Headers(),
        info: {} as never,
        session: trpcSession,
      });
    },
    onError: ({ error, path }) => {
      logger.error("tRPC error", { path, error, code: error.code });
    },
  });
};

export { handler as GET, handler as POST };
