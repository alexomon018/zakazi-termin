import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "../../atoms/Card";
import { cn } from "../../utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "primary" | "accent";
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  variant = "primary",
}: FeatureCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
          variant === "primary" ? "bg-primary/10" : "bg-accent/10"
        )}
      >
        <Icon
          className={cn(
            "w-6 h-6",
            variant === "primary" ? "text-primary" : "text-accent"
          )}
        />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}
