import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { API_URL } from "./api-url";
import { tokenStorage } from "./secure-store";

interface User {
  id: string;
  email: string;
  name?: string | null;
  salonName?: string | null;
}

interface RegisterParams {
  name: string;
  salonName: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Restore session from secure storage on mount
  useEffect(() => {
    async function restore() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          tokenStorage.getToken(),
          tokenStorage.getUser(),
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setToken(storedToken);
          setUser(parsedUser);
        } else if (storedToken || storedUser) {
          await tokenStorage.clear();
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

  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/mobile/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Prijava nije uspela.");
    }

    await Promise.all([
      tokenStorage.setToken(data.token),
      tokenStorage.setRefreshToken(data.refreshToken),
      tokenStorage.setUser(JSON.stringify(data.user)),
    ]);

    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (params: RegisterParams) => {
    const response = await fetch(`${API_URL}/api/mobile/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registracija nije uspela.");
    }

    await Promise.all([
      tokenStorage.setToken(data.token),
      tokenStorage.setRefreshToken(data.refreshToken),
      tokenStorage.setUser(JSON.stringify(data.user)),
    ]);

    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
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
      login,
      register,
      logout,
    }),
    [isLoading, token, user, login, register, logout]
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
