import type { AppRouter } from "@salonko/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import superjson from "superjson";
import { API_URL } from "./api-url";
import { tokenStorage } from "./secure-store";
import { refreshAccessToken } from "./token-refresh";

export const trpc = createTRPCReact<AppRouter>();

async function authAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const firstResponse = await fetch(input, init);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const newToken = await refreshAccessToken();
  if (!newToken) {
    return firstResponse;
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${newToken}`);

  return fetch(input, {
    ...init,
    headers,
  });
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // Don't retry FORBIDDEN errors — subscription is inactive
              if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") {
                return false;
              }
              return failureCount < 2;
            },
            staleTime: 30 * 1000, // 30 seconds
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          fetch: authAwareFetch,
          async headers() {
            const token = await tokenStorage.getToken();
            if (!token) return {};
            return {
              Authorization: `Bearer ${token}`,
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
