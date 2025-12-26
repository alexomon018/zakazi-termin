// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Determine environment: local, development, or production
function getEnvironment(): string {
  // Allow override via NEXT_PUBLIC_SENTRY_ENVIRONMENT env var (client-side)
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __SENTRY_ENV__?: string }).__SENTRY_ENV__
  ) {
    return (window as unknown as { __SENTRY_ENV__: string }).__SENTRY_ENV__;
  }

  // Use public env var for client-side
  if (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT) {
    return process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT;
  }

  // Default based on NODE_ENV (available at build time)
  if (process.env.NODE_ENV === "production") {
    return "production";
  }

  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  // Default to local for other cases
  return "local";
}

const environment = getEnvironment();

// Adjust sampling rates based on environment
const tracesSampleRate = environment === "production" ? 0.1 : 1.0;
const replaysSessionSampleRate = environment === "production" ? 0.1 : 1.0;

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://4e00c7afcef3fd7c112e645943be68a3@o4510600553431040.ingest.de.sentry.io/4510600571322448",

  // Set the environment
  environment,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // Higher rate in dev/local for better debugging, lower in production
  replaysSessionSampleRate,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
