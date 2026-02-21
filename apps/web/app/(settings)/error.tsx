"use client";

import { ErrorBoundaryUI } from "@salonko/ui";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, { extra: { digest: error.digest } });
  }, [error]);

  return (
    <ErrorBoundaryUI heading="Došlo je do greške pri učitavanju podešavanja" onRetry={reset} />
  );
}
