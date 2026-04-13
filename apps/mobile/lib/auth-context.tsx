import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { API_URL } from "./api-url";
import { authorize, isTokenExpired, revokeToken } from "./oauth-service";
import { tokenStorage } from "./secure-store";
import { clearQueryCache, registerClearSession } from "./session-cache-registry";
import { refreshAccessToken } from "./token-refresh";

export { clearSession } from "./session-cache-registry";

interface User {
  id: string;
  email: string;
  name?: string | null;
  salonName?: string | null;
  salonSlug?: string | null;
  avatarUrl?: string | null;
  locale?: string;
  timeZone?: string;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loginWithOAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(accessToken: string): Promise<User> {
  const response = await fetch(`${API_URL}/api/auth/oauth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Nije moguće učitati profil korisnika.");
  }

  const json = await response.json();
  return json.data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Expose clearSession to registry so TRPC error handlers can clear auth state
  useEffect(() => {
    registerClearSession(async () => {
      setToken(null);
      setUser(null);
      await tokenStorage.clear();
    });
    return () => {
      registerClearSession(null);
    };
  }, []);

  // Restore session from secure storage on mount
  useEffect(() => {
    async function restore() {
      try {
        const [storedToken, storedRefreshToken, storedExpiry, storedUser] = await Promise.all([
          tokenStorage.getToken(),
          tokenStorage.getRefreshToken(),
          tokenStorage.getTokenExpiry(),
          tokenStorage.getUser(),
        ]);

        if (!storedToken || !storedRefreshToken) {
          await tokenStorage.clear();
          return;
        }

        if (storedExpiry && isTokenExpired(storedExpiry)) {
          const newAccessToken = await refreshAccessToken();
          if (!newAccessToken) return;

          try {
            const profile = await fetchUserProfile(newAccessToken);
            await tokenStorage.setUser(JSON.stringify(profile));
            setToken(newAccessToken);
            setUser(profile);
          } catch {
            await tokenStorage.clear();
          }
          return;
        }

        // Access token still valid
        if (storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
        } else {
          // Have token but no cached user — fetch profile
          try {
            const profile = await fetchUserProfile(storedToken);
            await tokenStorage.setUser(JSON.stringify(profile));
            setToken(storedToken);
            setUser(profile);
          } catch {
            await tokenStorage.clear();
          }
        }
      } catch {
        await tokenStorage.clear();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restore();
  }, []);

  const loginWithOAuth = useCallback(async () => {
    const result = await authorize();
    const expiresAt = Date.now() + result.expiresIn * 1000;

    try {
      await Promise.all([
        tokenStorage.setToken(result.accessToken),
        tokenStorage.setRefreshToken(result.refreshToken),
        tokenStorage.setTokenExpiry(expiresAt),
      ]);

      const profile = await fetchUserProfile(result.accessToken);
      await tokenStorage.setUser(JSON.stringify(profile));

      setToken(result.accessToken);
      setUser(profile);
    } catch (error) {
      await tokenStorage.clear();
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    // Revoke the current access token (best-effort)
    const currentToken = await tokenStorage.getToken();
    if (currentToken) {
      await revokeToken(currentToken);
    }

    clearQueryCache();
    await tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!token && !!user,
      user,
      token,
      loginWithOAuth,
      logout,
    }),
    [isLoading, token, user, loginWithOAuth, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
