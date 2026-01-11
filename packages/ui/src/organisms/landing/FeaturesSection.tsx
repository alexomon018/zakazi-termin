"use client";

import { Bell, Calendar, Clock, Smartphone, TrendingUp, Users } from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Online zakazivanje",
    description:
      "Klijenti vide slobodne termine u realnom vremenu i zakazuju kada im odgovara — bez čekanja.",
  },
  {
    icon: Clock,
    title: "Automatizacija",
    description:
      "Klijenti biraju uslugu, termin i zaposlenog samostalno. Vi samo primate obaveštenja.",
  },
  {
    icon: Bell,
    title: "Podsetnici",
    description: "Automatski email i SMS podsetnici značajno smanjuju broj propuštenih termina.",
  },
  {
    icon: Users,
    title: "Tim",
    description:
      "Dodajte zaposlene, podesite im radno vreme i pratite zauzetost svakog člana tima.",
  },
  {
    icon: Smartphone,
    title: "Mobilni pristup",
    description: "Upravljajte terminima sa telefona, bilo gde i bilo kada — sve na jednom mestu.",
  },
  {
    icon: TrendingUp,
    title: "Izveštaji",
    description: "Pregledni izveštaji o prihodima, najpopularnijim uslugama i zauzetosti salona.",
  },
];

export function FeaturesSection() {
  return (
    <section id="funkcije" className="py-20 bg-white dark:bg-background lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Sve što vam treba na jednom mestu
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Jednostavan sistem koji štedi vreme i poboljšava iskustvo klijenata.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="relative p-6 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-muted/50"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20">
                <feature.icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
