"use client";

import { Button } from "@salonko/ui";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Došlo je do greške pri autentifikaciji
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Nešto je pošlo po zlu. Pokušajte ponovo ili se obratite podršci ako se problem nastavi.
        </p>
        <Button onClick={reset} size="lg">
          Pokušajte ponovo
        </Button>
      </div>
    </div>
  );
}
