/**
 * Feature flags controlled by environment variables.
 *
 * Use `NEXT_PUBLIC_` prefix so the value is inlined into the client bundle
 * at build time and can be read from both server and client code via the
 * same helper.
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function isEnvFlagEnabled(value: string | undefined): boolean {
  if (!value) return false;
  return TRUTHY.has(value.trim().toLowerCase());
}

/**
 * Whether the AI-powered messaging feature (WhatsApp/Viber channels + agent)
 * is enabled for this deployment. Disabled by default.
 */
export function isMessagingAiEnabled(): boolean {
  return isEnvFlagEnabled(process.env.NEXT_PUBLIC_MESSAGING_AI_ENABLED);
}
