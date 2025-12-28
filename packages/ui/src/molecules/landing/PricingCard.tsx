"use client";

import { Check } from "lucide-react";
import { Button } from "@salonko/ui/atoms/Button";
import { Card } from "@salonko/ui/atoms/Card";
import { cn } from "@salonko/ui/utils";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";

interface PricingCardProps {
  plan: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline";
  badge?: string;
  highlighted?: boolean;
  delay?: number;
}

export function PricingCard({
  plan,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  badge,
  highlighted = false,
  delay = 0,
}: PricingCardProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay,
  });

  return (
    <Card
      ref={ref}
      className={cn(
        "p-8 transition-all duration-300 hover:shadow-elevated-lg hover:-translate-y-1 relative",
        highlighted && "border-2 border-primary shadow-glow",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 px-4 py-1 text-sm font-semibold rounded-full -translate-x-1/2 bg-gradient-primary text-primary-foreground shadow-elevated">
          {badge}
        </div>
      )}
      <h3 className="mb-2 text-2xl font-bold text-foreground">{plan}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground"> {period}</span>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      <ul className="mb-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 items-start">
            <Check
              aria-hidden="true"
              className="w-5 h-5 text-primary mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={buttonVariant}
        className={cn(
          "w-full transition-all duration-200 hover:scale-105",
          buttonVariant === "outline" && "bg-transparent"
        )}
      >
        {buttonText}
      </Button>
    </Card>
  );
}
