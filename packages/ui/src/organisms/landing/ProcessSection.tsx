"use client";

import { Link2, Settings, UserPlus } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: "Napravite nalog",
    description: "Registrujte se besplatno i unesite osnovne podatke o vašem salonu.",
  },
  {
    step: 2,
    icon: Settings,
    title: "Podesite usluge",
    description: "Dodajte usluge, cene, zaposlene i radno vreme — sve na jednom mestu.",
  },
  {
    step: 3,
    icon: Link2,
    title: "Podelite link",
    description: "Podelite link sa klijentima i počnite da primate online termine.",
  },
];

export function ProcessSection() {
  return (
    <section id="kako-radi" className="py-20 lg:py-28 bg-gray-50 dark:bg-muted/30">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Kako funkcioniše
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Započnite za samo par minuta — bez tehničkog znanja.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 mt-16 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center">
              {/* Connector line (hidden on mobile, visible on desktop) */}
              {index < steps.length - 1 && (
                <div className="absolute hidden md:block top-8 left-[60%] w-[80%] h-px bg-gray-200 dark:bg-border" />
              )}

              {/* Step number with icon */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-white dark:bg-card ring-1 ring-gray-200 dark:ring-border">
                <step.icon className="w-7 h-7 text-primary" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-primary">
                  {step.step}
                </span>
              </div>

              <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
