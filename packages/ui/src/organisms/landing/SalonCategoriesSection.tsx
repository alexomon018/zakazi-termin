import { SALON_TYPES } from "@salonko/config";
import type { LucideIcon } from "lucide-react";
import { Dog, Droplets, Eye, Gem, Paintbrush, Pen, Scissors, Sparkles, Waves } from "lucide-react";
import Link from "next/link";

const categoryIcons: Record<string, LucideIcon> = {
  frizerski_salon: Scissors,
  barber_shop: Scissors,
  salon_za_nokte: Paintbrush,
  masaza: Waves,
  spa_centar: Droplets,
  obrve_i_trepavice: Eye,
  sminkanje: Sparkles,
  salon_za_kucne_ljubimce: Dog,
  kozmeticki_salon: Gem,
  tetoviraliste: Pen,
  studio_za_pirsing: Gem,
  depilacija: Sparkles,
};

export function SalonCategoriesSection() {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-background">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">Kategorije</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pronađite salon po kategoriji
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Izaberite tip salona i pregledajte dostupne termine.
          </p>
        </div>

        {/* Categories grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {SALON_TYPES.map((type) => {
            const Icon = categoryIcons[type.id] ?? Scissors;
            return (
              <Link
                key={type.id}
                href={`/saloni?type=${type.id}`}
                className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
                  <Icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-foreground text-center group-hover:text-primary transition-colors">
                  {type.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
