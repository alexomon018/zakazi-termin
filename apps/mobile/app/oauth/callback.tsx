import { Redirect } from "expo-router";

/**
 * Catch the salonko://oauth/callback deep link so expo-router doesn't
 * match it against the (public)/[salonSlug]/[eventSlug] catch-all.
 * The actual token exchange is handled by WebBrowser.maybeCompleteAuthSession()
 * at module scope in _layout.tsx — this route just prevents a stale screen.
 */
export default function OAuthCallback() {
  return <Redirect href="/(tabs)" />;
}
