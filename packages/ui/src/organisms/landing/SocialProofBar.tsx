import * as React from "react";
import { StatDisplay } from "../../molecules/landing/StatDisplay";

export function SocialProofBar() {
  const stats = [
    { value: "500+", label: "Zadovoljnih salona" },
    { value: "50,000+", label: "Termina mesečno" },
    { value: "95%", label: "Manje propuštenih" },
    { value: "4.9★", label: "Ocena korisnika" },
  ];

  return (
    <section className="py-12 border-y border-border bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
          {stats.map((stat, index) => (
            <StatDisplay key={index} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
