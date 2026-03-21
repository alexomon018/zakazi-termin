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

function AutoLoginHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const rawCallbackUrl = searchParams.get("callbackUrl") || "/dashboard/settings/billing";
    // Only allow internal dashboard paths to prevent open redirect
    const callbackUrl = rawCallbackUrl.startsWith("/dashboard")
      ? rawCallbackUrl
      : "/dashboard/settings/billing";

    if (!token || !email) {
      router.replace("/login");
      return;
    }

    signIn("credentials", {
      email,
      autoLoginToken: token,
      redirect: false,
      callbackUrl,
    }).then((result) => {
      if (result?.ok) {
        router.replace(callbackUrl);
      } else {
        router.replace("/login");
      }
    });
  }, [router, searchParams]);

  return <AutoLoginLoading />;
}
