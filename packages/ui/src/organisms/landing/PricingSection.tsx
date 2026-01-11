"use client";

import { PRICING_CONFIG } from "@salonko/config";
import { Button } from "@salonko/ui/atoms/Button";
import { cn } from "@salonko/ui/utils";
import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const features = [
  "Neograničeni termini",
  "Online zakazivanje 24/7",
  "Email podsetnici",
  "Upravljanje rasporedom",
  "Google Calendar sinhronizacija",
  "Personalizovana stranica",
  "Mobilni pristup",
  "Email podrška",
];

export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const currentPricing = PRICING_CONFIG[billingInterval];

  return (
    <section id="cene" className="py-20 bg-white dark:bg-background lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Jednostavna cena
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            30 dana besplatno. Bez kreditne kartice. Otkažite bilo kada.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mt-10">
          <div className="inline-flex items-center p-1 rounded-full bg-gray-100 dark:bg-muted">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-5 py-2 text-sm font-medium rounded-full transition-all",
                billingInterval === "monthly"
                  ? "bg-white dark:bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mesečno
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "relative px-5 py-2 text-sm font-medium rounded-full transition-all",
                billingInterval === "yearly"
                  ? "bg-white dark:bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Godišnje
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-emerald-500 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mt-10">
          <div className="relative p-8 bg-white dark:bg-card rounded-2xl ring-1 ring-gray-200 dark:ring-border shadow-lg">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1.5 text-sm font-medium text-white bg-primary rounded-full">
                30 dana besplatno
              </span>
            </div>

            {/* Price */}
            <div className="mt-4 text-center">
              <h3 className="text-xl font-semibold text-foreground">Salonko Pro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sve što vam treba za upravljanje salonom
              </p>

              <div className="mt-6">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {currentPricing.price}
                </span>
                <span className="ml-1 text-muted-foreground">
                  RSD/{billingInterval === "monthly" ? "mes" : "god"}
                </span>
              </div>

              {billingInterval === "yearly" && currentPricing.total && (
                <p className="mt-2 text-sm text-muted-foreground">{currentPricing.total}</p>
              )}
            </div>

            {/* CTA */}
            <Button className="w-full mt-8" size="lg" asChild>
              <Link href="/signup">Započni besplatno</Link>
            </Button>
            <p className="mt-3 text-xs text-center text-muted-foreground">
              Bez obaveza. Otkažite bilo kada.
            </p>

            {/* Features */}
            <div className="pt-8 mt-8 border-t border-gray-100 dark:border-border">
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 text-emerald-500 shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <p className="mt-10 text-sm text-center text-muted-foreground">
          Sigurno plaćanje · SSL zaštićeno · GDPR usklađeno
        </p>
      </div>
    </section>
  );
}
