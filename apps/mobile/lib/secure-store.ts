import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

/**
 * Secure token storage abstraction.
 * Uses expo-secure-store on native, AsyncStorage-style on web.
 */
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    return getItem(TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    return setItem(TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    return setItem(REFRESH_TOKEN_KEY, token);
  },

  async getUser(): Promise<string | null> {
    return getItem(USER_KEY);
  },

  async setUser(user: string): Promise<void> {
    return setItem(USER_KEY, user);
  },

  async clear(): Promise<void> {
    await deleteItem(TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
    await deleteItem(USER_KEY);
  },
};
