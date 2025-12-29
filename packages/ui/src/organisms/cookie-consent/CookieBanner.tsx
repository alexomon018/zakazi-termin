"use client";

import Link from "next/link";
import { Button } from "../../atoms/Button";
import { useCookieConsent } from "../../hooks/useCookieConsent";
import { cn } from "../../utils";

export function CookieBanner() {
  const { hasConsented, acceptAll, acceptNecessaryOnly } = useCookieConsent();

  if (hasConsented) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-card",
        "p-4 md:p-6",
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground text-center md:text-left">
          <p className="font-semibold text-foreground mb-1">Kolacici za bolje iskustvo</p>
          <p>
            Koristimo neophodne kolacice da bi sajt radio ispravno, a uz tvoju dozvolu i analiticke
            kolacice za unapredjenje platforme. Podesavanja mozes promeniti u bilo kom trenutku.
            Vise informacija potrazi u nasoj{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              politici kolacica
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" onClick={acceptNecessaryOnly}>
            Samo neophodni
          </Button>
          <Button onClick={acceptAll}>Prihvatam sve</Button>
        </div>
      </div>
    </div>
  );
}
