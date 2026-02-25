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
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // In development, derive from Expo dev server host
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    // Next.js dev server default port
    return `http://${host}:3000`;
  }

  // Fallback for local development
  return "http://localhost:3000";
}

export const API_URL = getApiUrl();
