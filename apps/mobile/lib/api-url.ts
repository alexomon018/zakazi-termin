import Constants from "expo-constants";

/**
 * Resolves the base URL for API requests.
 *
 * In development:
 *  - Uses EXPO_PUBLIC_API_URL from env if set
 *  - Falls back to the Expo dev server host (works on physical devices + simulators)
 *
 * In production:
 *  - Uses EXPO_PUBLIC_API_URL (must be set in EAS build config)
 */
function getApiUrl(): string {
  const isProduction = process.env.NODE_ENV === "production";
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    if (isProduction && envUrl.startsWith("http://")) {
      throw new Error("EXPO_PUBLIC_API_URL must use https:// in production");
    }
    return envUrl;
  }

  if (isProduction) {
    throw new Error("EXPO_PUBLIC_API_URL must be set in production");
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
}

export const API_URL = getApiUrl();
