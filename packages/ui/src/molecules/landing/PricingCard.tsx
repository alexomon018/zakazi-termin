import * as React from "react";
import { Check } from "lucide-react";
import { Card } from "../../atoms/Card";
import { Button } from "../../atoms/Button";
import { cn } from "../../utils";

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
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "p-8 hover:shadow-xl transition-shadow relative",
        highlighted && "border-2 border-primary"
      )}
    >
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full">
          {badge}
        </div>
      )}
      <h3 className="text-2xl font-bold text-foreground mb-2">{plan}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-foreground">{price}</span>
        <span className="text-muted-foreground"> {period}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">{description}</p>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check aria-hidden="true" className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={buttonVariant}
        className={cn("w-full", buttonVariant === "outline" && "bg-transparent")}
      >
        {buttonText}
      </Button>
    </Card>
  );
}
