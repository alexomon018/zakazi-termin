"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { Card } from "@salonko/ui/atoms/Card";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const features = [
  "Neograničeni termini",
  "Online zakazivanje 24/7",
  "Email podsetnici za klijente",
  "Upravljanje rasporedom",
  "Google Calendar sinhronizacija",
  "Personalizovana stranica za zakazivanje",
  "Mobilni pristup",
  "Podrška putem emaila",
];

export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const headerRef = useScrollAnimation({ threshold: 0.2, triggerOnce: true });
  const cardRef = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay: 100,
  });

  const pricing = {
    monthly: {
      price: "5.000",
      period: "mesečno",
      total: "5.000 RSD/mes",
      savings: null,
    },
    yearly: {
      price: "50.000",
      period: "godišnje",
      total: "~4.167 RSD/mes",
      savings: "2 meseca besplatno",
    },
  };

  const currentPricing = pricing[billingInterval];

  return (
    <section id="cene" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div
          ref={headerRef.ref}
          className={cn(
            "mb-12 text-center transition-all duration-700 ease-out",
            headerRef.isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          )}
        >
          <h2 className="mb-4 text-3xl font-bold text-balance text-foreground sm:text-4xl lg:text-5xl">
            Jednostavna cena, sve funkcije
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-pretty text-muted-foreground">
            30 dana besplatno. Bez kreditne kartice. Otkažite bilo kada.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5">
            <button
              type="button"
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-all",
                billingInterval === "monthly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Mesečno
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "relative rounded-full px-5 py-2 text-sm font-medium transition-all",
                billingInterval === "yearly"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Godišnje
              {billingInterval !== "yearly" && (
                <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  -17%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Single Pricing Card */}
        <div className="pt-4 mx-auto max-w-lg">
          <Card
            ref={cardRef.ref}
            className={cn(
              "relative border-2 border-primary p-8 shadow-glow transition-all duration-500",
              cardRef.isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            )}
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 px-4 py-1 text-sm font-semibold rounded-full -translate-x-1/2 bg-gradient-primary text-primary-foreground shadow-elevated">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                30 dana besplatno
              </span>
            </div>

            {/* Savings Badge for Yearly */}
            {billingInterval === "yearly" && currentPricing.savings && (
              <div className="absolute top-4 right-4 px-3 py-1 text-xs font-bold text-white bg-green-500 rounded-full">
                {currentPricing.savings}
              </div>
            )}

            <div className="mt-4 text-center">
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                Salonko
              </h3>
              <p className="mb-6 text-muted-foreground">
                Sve što vam treba za upravljanje salonom
              </p>

              <div className="mb-2">
                <span className="text-5xl font-bold text-foreground">
                  {currentPricing.price}
                </span>
                <span className="ml-2 text-lg text-muted-foreground">
                  RSD/{billingInterval === "monthly" ? "mes" : "god"}
                </span>
              </div>

              {billingInterval === "yearly" && (
                <p className="mb-6 text-sm text-muted-foreground">
                  {currentPricing.total}
                </p>
              )}

              <Link href="/signup" className="block">
                <Button size="lg" className="mt-4 w-full text-base">
                  Započni besplatni probni period
                </Button>
              </Link>

              <p className="mt-3 text-xs text-muted-foreground">
                Bez obaveza. Otkažite bilo kada.
              </p>
            </div>

            <hr className="my-8 border-border" />

            <ul className="space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3 items-start">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Trust Badges */}
        <div
          className={cn(
            "mt-12 text-center transition-all delay-300 duration-700",
            cardRef.isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          )}
        >
          <p className="text-sm text-muted-foreground">
            Sigurno plaćanje putem Stripe-a • SSL zaštićeno • GDPR usklađeno
          </p>
        </div>
      </div>
    </section>
  );
}
