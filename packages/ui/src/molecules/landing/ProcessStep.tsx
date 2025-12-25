import * as React from "react";

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  showConnector?: boolean;
}

export function ProcessStep({ step, title, description, showConnector = false }: ProcessStepProps) {
  return (
    <div className="relative">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
          {step}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {showConnector && (
        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
      )}
    </div>
  );
}
