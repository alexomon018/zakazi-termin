import type { AppRouter } from "@salonko/trpc";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCClientError, createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import superjson from "superjson";
import { API_URL } from "./api-url";
import { clearSession } from "./auth-context";
import { tokenStorage } from "./secure-store";
import { refreshAccessToken } from "./token-refresh";

export const trpc = createTRPCReact<AppRouter>();

/**
 * Module-level ref to the QueryClient instance.
 * Allows clearSession (outside React tree) to purge cached data
 * when a session is terminated, preventing stale user data leaks.
 */
let queryClientRef: QueryClient | null = null;

/** Imperatively clear all react-query caches. Safe to call outside React components. */
export function clearQueryCache(): void {
  queryClientRef?.clear();
}

async function authAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const firstResponse = await fetch(input, init);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const newToken = await refreshAccessToken();
  if (!newToken) {
    clearSession();
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
              // Don't retry FORBIDDEN errors — subscription inactive or membership revoked
              if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") {
                return false;
              }
              return failureCount < 2;
            },
            staleTime: 30 * 1000, // 30 seconds
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            const key = query.queryKey as unknown[];
            const isUserMe = Array.isArray(key[0]) && key[0][0] === "user" && key[0][1] === "me";

            if (error instanceof TRPCClientError) {
              const code = error.data?.code;

              // When user.me itself fails with auth error, the session is invalid — clear local auth state
              if (isUserMe && (code === "FORBIDDEN" || code === "UNAUTHORIZED")) {
                clearSession();
                return;
              }

              // For other queries, re-fetch user.me to check if session is still valid
              if (!isUserMe && code === "FORBIDDEN") {
                queryClient.invalidateQueries({ queryKey: [["user", "me"]] });
              }
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            // On FORBIDDEN errors, re-fetch user profile to detect membership revocation.
            // This triggers role-aware UI (team menu, settings) to update automatically.
            if (error instanceof TRPCClientError && error.data?.code === "FORBIDDEN") {
              queryClient.invalidateQueries({ queryKey: [["user", "me"]] });
            }
          },
        }),
      })
  );

  // Expose queryClient to module-level ref so clearSession can purge caches
  queryClientRef = queryClient;

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
