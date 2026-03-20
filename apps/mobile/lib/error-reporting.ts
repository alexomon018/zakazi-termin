import * as Sentry from "@sentry/react-native";
import type { ErrorInfo } from "react";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

/** Call once at app startup; no-ops in development or when DSN is unset. */
export function initErrorReporting(): void {
  if (__DEV__ || !dsn || initialized) {
    return;
  }
  Sentry.init({
    dsn,
    enabled: true,
  });
  initialized = true;
}

/** Reports React error boundary failures to Sentry in production; console is fallback. */
export function reportErrorBoundaryException(error: Error, info: ErrorInfo): void {
  if (__DEV__ || !dsn) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    return;
  }

  try {
    if (!initialized) {
      initErrorReporting();
    }
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: info.componentStack,
        },
      },
    });
  } catch (reportErr) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    console.error("Sentry reporting failed:", reportErr);
  }
}
