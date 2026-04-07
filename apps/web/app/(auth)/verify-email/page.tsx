import { Suspense } from "react";
import VerifyEmailClient from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">Učitavanje…</div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
