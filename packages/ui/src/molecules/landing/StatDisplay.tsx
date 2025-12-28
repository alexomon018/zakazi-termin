"use client";

import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";

interface StatDisplayProps {
  value: string;
  label: string;
  delay?: number;
}

export function StatDisplay({ value, label, delay = 0 }: StatDisplayProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
    delay,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "text-center transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      <div className="text-3xl font-bold text-foreground mb-1 transition-all duration-300 hover:scale-110">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
