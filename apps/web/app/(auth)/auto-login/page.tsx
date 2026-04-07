"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

export default function AutoLoginPage() {
  return (
    <Suspense fallback={<AutoLoginLoading />}>
      <AutoLoginHandler />
    </Suspense>
  );
}

function AutoLoginLoading() {
  return (
    <div className="flex flex-col gap-3 items-center justify-center min-h-[200px]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Prijavljivanje...</p>
    </div>
  );
}

/** Parse token and email from the URL fragment to keep them out of server logs. */
function parseFragment(): { token: string | null; email: string | null } {
  if (typeof window === "undefined") return { token: null, email: null };
  const hash = window.location.hash.slice(1); // remove leading '#'
  if (!hash) return { token: null, email: null };
  const params = new URLSearchParams(hash);
  return { token: params.get("token"), email: params.get("email") };
}

function AutoLoginHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    // Credentials live in the fragment (never sent to the server).
    // callbackUrl stays in the query string (safe, non-sensitive).
    const { token, email } = parseFragment();
    const rawCallbackUrl = searchParams.get("callbackUrl") || "/dashboard/settings/billing";
    const callbackUrl = /^\/dashboard(?:\/|$)/.test(rawCallbackUrl)
      ? rawCallbackUrl
      : "/dashboard/settings/billing";

    // Clear the fragment immediately so the token doesn't linger in the address bar
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    if (!token || !email) {
      router.replace("/login");
      return;
    }

    void (async () => {
      try {
        const result = await signIn("credentials", {
          email,
          autoLoginToken: token,
          redirect: false,
          callbackUrl,
        });
        router.replace(result?.ok ? callbackUrl : "/login");
      } catch {
        router.replace("/login");
      }
    })();
  }, [router, searchParams]);

  return <AutoLoginLoading />;
}
