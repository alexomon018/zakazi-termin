"use client";

import { ProcessStep } from "@salonko/ui/molecules/landing/ProcessStep";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";

export function ProcessSection() {
  const headerRef = useScrollAnimation({ threshold: 0.2, triggerOnce: true });
  const steps = [
    {
      step: 1,
      title: "Napravite nalog",
      description: "Registrujte se besplatno i dodajte osnovne informacije o vašem salonu.",
      showConnector: true,
    },
    {
      step: 2,
      title: "Podesite usluge",
      description: "Unesite vaše usluge, cene, zaposlene i radno vreme salona.",
      showConnector: true,
    },
    {
      step: 3,
      title: "Podelite link",
      description: "Podelite vaš jedinstveni link sa klijentima i počnite da primate termine!",
      showConnector: false,
    },
  ];

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div
          ref={headerRef.ref}
          className={cn(
            "text-center mb-16 transition-all duration-700 ease-out",
            headerRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Započnite za samo 3 koraka
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Podešavanje je brzo i jednostavno - ne trebaju vam tehničke veštine
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <ProcessStep
              key={step.step}
              step={step.step}
              title={step.title}
              description={step.description}
              showConnector={step.showConnector}
              delay={index * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
