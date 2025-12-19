import * as React from "react";
import {
  Calendar,
  Clock,
  Bell,
  Users,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { FeatureCard } from "../../molecules/landing/FeatureCard";

export function FeaturesSection() {
  const features = [
    {
      icon: Calendar,
      title: "Online kalendar",
      description:
        "Vaši klijenti vide slobodne termine u realnom vremenu i zakazuju kada im odgovara.",
      variant: "primary" as const,
    },
    {
      icon: Clock,
      title: "Automatsko zakazivanje",
      description:
        "Klijenti samostalno biraju uslugu, termin i frizera - bez vašeg angažmana.",
      variant: "accent" as const,
    },
    {
      icon: Bell,
      title: "SMS podsetnici",
      description:
        "Automatska obaveštenja smanjuju broj propuštenih termina za preko 70%.",
      variant: "primary" as const,
    },
    {
      icon: Users,
      title: "Upravljanje osobljem",
      description:
        "Dodajte više zaposlenih, podešavajte radno vreme i pratite njihovu zauzetost.",
      variant: "accent" as const,
    },
    {
      icon: Smartphone,
      title: "Mobilna aplikacija",
      description:
        "Pratite termine i upravljajte radom salona sa telefona, bilo gde, bilo kada.",
      variant: "primary" as const,
    },
    {
      icon: TrendingUp,
      title: "Analitika i izveštaji",
      description:
        "Pregledni izveštaji o prihodima, popularnim uslugama i zauzetosti salona.",
      variant: "accent" as const,
    },
  ];

  return (
    <section
      id="funkcije"
      className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Sve što vam treba za upravljanje terminima
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Jednostavan sistem koji štedi vaše vreme i poboljšava iskustvo vaših
            klijenata
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              variant={feature.variant}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
