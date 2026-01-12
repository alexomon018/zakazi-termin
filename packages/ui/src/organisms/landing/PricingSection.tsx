"use client";

import { PLAN_TIERS, PRICING_CONFIG } from "@salonko/config";
import type { PlanTier } from "@salonko/config";
import { Button } from "@salonko/ui/atoms/Button";
import { cn } from "@salonko/ui/utils";
import { Check } from "lucide-react";
import Link from "next/link";

type PricingCardProps = {
  plan: PlanTier;
  isHighlighted?: boolean;
};

function PricingCard({ plan, isHighlighted }: PricingCardProps) {
  const config = PRICING_CONFIG[plan];

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 bg-white dark:bg-card rounded-2xl ring-1 shadow-lg h-full",
        isHighlighted ? "ring-2 ring-primary" : "ring-gray-200 dark:ring-border"
      )}
    >
      {/* Badge */}
      {config.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className={cn(
              "px-3 py-1 text-xs font-medium text-white rounded-full whitespace-nowrap",
              isHighlighted ? "bg-primary" : "bg-emerald-500"
            )}
          >
            {config.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mt-2 text-center">
        <h3 className="text-lg font-semibold text-foreground">{config.name}</h3>
        <div className="mt-3">
          <span className="text-3xl font-bold tracking-tight text-foreground">{config.price}</span>
          <span className="ml-1 text-sm text-muted-foreground">
            RSD/{config.billingInterval === "MONTH" ? "mes" : "god"}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Button
        className="w-full mt-6"
        size="default"
        variant={isHighlighted ? "default" : "outline"}
        asChild
      >
        <Link href="/signup">Započni besplatno</Link>
      </Button>

      {/* Features */}
      <div className="pt-6 mt-6 border-t border-gray-100 dark:border-border flex-1">
        <ul className="space-y-2.5">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="cene" className="py-20 bg-white dark:bg-background lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Izaberite plan koji vam odgovara
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            30 dana besplatno. Bez kreditne kartice. Otkažite bilo kada.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_TIERS.map((tier) => (
            <PricingCard key={tier} plan={tier} isHighlighted={tier === "growth"} />
          ))}
        </div>

        {/* Trust indicators */}
        <p className="mt-10 text-sm text-center text-muted-foreground">
          Sigurno plaćanje · SSL zaštićeno · GDPR usklađeno
        </p>
      </div>
    </section>
  );
}
