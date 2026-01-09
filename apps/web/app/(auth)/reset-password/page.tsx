import { Suspense } from "react";
import ResetPasswordClient from "./reset-password-client";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">Učitavanje…</div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
