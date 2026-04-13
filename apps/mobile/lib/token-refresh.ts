import { refreshTokens } from "./oauth-service";
import { tokenStorage } from "./secure-store";

let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token with single-flight deduplication.
 * All concurrent callers share one in-flight request, preventing
 * the server from seeing a rotated-out refresh token twice.
 */
export async function refreshAccessToken(): Promise<string | null> {
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
      } catch (error) {
        const isTransient =
          error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
        if (!isTransient) {
          await tokenStorage.clear();
        }
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
