"use client";

import type { LucideIcon } from "lucide-react";
import { Card } from "@salonko/ui/atoms/Card";
import { cn } from "@salonko/ui/utils";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "accent";
  delay?: number;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  variant = "primary",
  delay = 0,
}: FeatureCardProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
    delay,
  });

  return (
    <Card
      ref={ref}
      className={cn(
        "p-6 transition-all duration-300 hover:shadow-elevated-lg hover:-translate-y-1 group",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110",
          variant === "primary"
            ? "bg-primary/10 dark:bg-primary/25 group-hover:bg-primary/20 dark:group-hover:bg-primary/35"
            : "bg-accent/10 dark:bg-accent/25 group-hover:bg-accent/20 dark:group-hover:bg-accent/35"
        )}
      >
        <Icon
          aria-hidden="true"
          className={cn(
            "w-6 h-6 transition-transform duration-300 group-hover:scale-110",
            variant === "primary"
              ? "text-primary dark:text-primary"
              : "text-accent dark:text-accent-foreground"
          )}
        />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
