"use client";

import { StatDisplay } from "@salonko/ui/molecules/landing/StatDisplay";

export function SocialProofBar() {
  const stats = [
    { value: "500+", label: "Zadovoljnih salona" },
    { value: "50,000+", label: "Termina mesečno" },
    { value: "95%", label: "Manje propuštenih" },
    { value: "4.9★", label: "Ocena korisnika" },
  ];

  return (
    <section className="py-12 border-y border-border bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-border/20 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {stats.map((stat, index) => (
            <StatDisplay
              key={stat.label}
              value={stat.value}
              label={stat.label}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
