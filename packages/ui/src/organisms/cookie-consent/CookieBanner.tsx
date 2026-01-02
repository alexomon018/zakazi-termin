"use client";

import Link from "next/link";
import { Button } from "../../atoms/Button";
import { useCookieConsent } from "../../hooks/useCookieConsent";
import { cn } from "../../utils";

export function CookieBanner() {
  const { hasConsented, isHydrated, acceptAll, acceptNecessaryOnly } = useCookieConsent();

  // Don't render anything until we've checked the cookie
  if (!isHydrated || hasConsented) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 left-0 z-50",
        "border-t border-border bg-card",
        "p-4 md:p-6",
        "duration-300 animate-in slide-in-from-bottom"
      )}
    >
      <div className="flex flex-col gap-4 justify-between items-center mx-auto max-w-7xl md:flex-row">
        <div className="text-sm text-center text-muted-foreground md:text-left">
          <p className="mb-1 font-semibold text-foreground">Kolačići za bolje iskustvo</p>
          <p>
            Koristimo neophodne kolačiće da bi sajt radio ispravno, a uz tvoju dozvolu i analitičke
            kolačiće za unapređenje platforme. Podešavanja možeš promeniti u bilo kom trenutku. Više
            informacija potraži u našoj{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              politici kolačića
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
