import type { AppRouter } from "@salonko/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import superjson from "superjson";
import { API_URL } from "./api-url";
import { refreshTokens } from "./oauth-service";
import { tokenStorage } from "./secure-store";

export const trpc = createTRPCReact<AppRouter>();

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const storedRefreshToken = await tokenStorage.getRefreshToken();
  if (!storedRefreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const result = await refreshTokens(storedRefreshToken);
        const expiresAt = Date.now() + result.expiresIn * 1000;

        await Promise.all([
          tokenStorage.setToken(result.accessToken),
          tokenStorage.setRefreshToken(result.refreshToken),
          tokenStorage.setTokenExpiry(expiresAt),
        ]);
        return result.accessToken;
      } catch {
        await tokenStorage.clear();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

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
            // On mobile, retry less aggressively
            retry: 2,
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
