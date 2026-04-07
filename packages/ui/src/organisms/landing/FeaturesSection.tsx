import type { LucideIcon } from "lucide-react";
import { Bell, Calendar, Clock, Smartphone, TrendingUp, Users } from "lucide-react";

interface FeatureItem {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

const defaultFeatures: FeatureItem[] = [
  {
    id: "online-booking",
    icon: Calendar,
    title: "Klijenti zakazuju non-stop",
    description:
      "Klijenti vide slobodne termine u realnom vremenu i zakazuju kada im odgovara — bez čekanja.",
  },
  {
    id: "less-work",
    icon: Clock,
    title: "Manje posla za vas",
    description:
      "Klijenti biraju uslugu, termin i zaposlenog samostalno. Vi samo primate obaveštenja.",
  },
  {
    id: "reminders",
    icon: Bell,
    title: "Manje propuštenih termina",
    description: "Automatski email i SMS podsetnici značajno smanjuju broj propuštenih termina.",
  },
  {
    id: "team-management",
    icon: Users,
    title: "Upravljajte celim timom",
    description:
      "Dodajte zaposlene, podesite im radno vreme i pratite zauzetost svakog člana tima.",
  },
  {
    id: "mobile-access",
    icon: Smartphone,
    title: "Salon u džepu",
    description: "Upravljajte terminima sa telefona, bilo gde i bilo kada — sve na jednom mestu.",
  },
  {
    id: "analytics",
    icon: TrendingUp,
    title: "Znajte koliko zarađujete",
    description: "Pregledni izveštaji o prihodima, najpopularnijim uslugama i zauzetosti salona.",
  },
];

interface FeaturesSectionProps {
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

export function FeaturesSection({
  title = "Sve što vam treba na jednom mestu",
  subtitle = "Jednostavan sistem koji štedi vreme i poboljšava iskustvo klijenata.",
  features = defaultFeatures,
}: FeaturesSectionProps = {}) {
  return (
    <section id="funkcije" className="py-20 bg-white dark:bg-background lg:py-28">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">Funkcije</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 mt-16 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.id ?? feature.title}
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
