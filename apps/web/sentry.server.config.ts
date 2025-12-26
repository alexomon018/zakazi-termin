// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Determine environment: local, development, or production
function getEnvironment(): string {
  // Allow override via SENTRY_ENVIRONMENT env var
  if (process.env.SENTRY_ENVIRONMENT) {
    return process.env.SENTRY_ENVIRONMENT;
  }

  // Default based on NODE_ENV
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
// Production: lower sampling to reduce costs
// Development/Local: higher sampling for better debugging
const tracesSampleRate = environment === "production" ? 0.1 : 1.0;

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://4e00c7afcef3fd7c112e645943be68a3@o4510600553431040.ingest.de.sentry.io/4510600571322448",

  // Set the environment
  environment,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Only send errors in production, send everything in dev/local
  beforeSend(event, hint) {
    // In local environment, you might want to log to console instead
    if (environment === "local") {
      console.error("Sentry Event:", event);
      console.error("Sentry Hint:", hint);
    }
    return event;
  },
});
