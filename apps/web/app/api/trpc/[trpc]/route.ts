import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createTRPCContext, type Context } from "@zakazi-termin/trpc";
import { getSession } from "@/lib/auth";

const handler = async (req: Request) => {
  const session = await getSession();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      return createTRPCContext({
        req,
        resHeaders: new Headers(),
        info: {} as never,
        session: session
          ? {
              user: {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                username: session.user.username,
              },
            }
          : null,
      });
    },
    onError: ({ error, path }) => {
      console.error(`tRPC Error on '${path}':`, error);
    },
  });
};

export { handler as GET, handler as POST };
