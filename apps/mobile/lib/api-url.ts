import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeAndroidDevHost(url: string): string {
  if (Platform.OS !== "android") {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.hostname = "10.0.2.2";
      return parsed.toString().replace(/\/$/, "");
    }
    return url;
  } catch {
    return url;
  }
}

/**
 * Resolves the base URL for API requests.
 *
 * In development:
 *  - Uses EXPO_PUBLIC_API_URL from env if set
 *  - Falls back to the Expo dev server host (works on physical devices + simulators)
 *
 * In production:
 *  - Uses EXPO_PUBLIC_API_URL (must be set in EAS build config)
 *  - Returns empty string during `expo export` static rendering when the env var
 *    is unavailable — the real value is baked into the JS bundle by EAS Build.
 */
function getApiUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    if (isProduction && envUrl.startsWith("http://")) {
      throw new Error("EXPO_PUBLIC_API_URL must use https:// in production");
    }
    return normalizeAndroidDevHost(envUrl);
  }

  if (isProduction) {
    return "";
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return normalizeAndroidDevHost(`http://${host}:3000`);
  }

  return normalizeAndroidDevHost("http://localhost:3000");
}

export const API_URL = getApiUrl();

/** The web app's public origin — same as API_URL since Next.js serves both. */
export const WEB_ORIGIN = API_URL;
