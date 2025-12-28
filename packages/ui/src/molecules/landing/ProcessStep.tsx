"use client";

import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  showConnector?: boolean;
  delay?: number;
}

export function ProcessStep({
  step,
  title,
  description,
  showConnector = false,
  delay = 0,
}: ProcessStepProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
    delay,
  });

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "text-center transition-all duration-700 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="relative w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-glow transition-all duration-300 hover:scale-110">
          {step}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {showConnector && (
        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
      )}
    </div>
  );
}
