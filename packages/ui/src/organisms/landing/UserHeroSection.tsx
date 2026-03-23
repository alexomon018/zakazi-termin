"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { ArrowRight, MapPin, Search, Star } from "lucide-react";
import Link from "next/link";

interface UserHeroSectionProps {
  onSearchClick?: () => void;
}

export function UserHeroSection({ onSearchClick }: UserHeroSectionProps) {
  const scrollToSearch = () => {
    if (onSearchClick) {
      onSearchClick();
      return;
    }
    const searchSection = document.getElementById("pronadji-salon");
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: "smooth" });
      const searchInput = searchSection.querySelector("input");
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 500);
      }
    }
  };

  return (
    <section className="relative overflow-hidden bg-white dark:bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] opacity-40" />

      <div className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/5 text-primary dark:bg-primary/10">
            <Star className="w-3.5 h-3.5 fill-primary" />
            100+ salona širom Srbije
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Zakažite termin u <span className="text-primary">omiljenom salonu</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
            Pronađite frizerske salone, kozmetičke salone, spa centre i još mnogo toga. Zakažite
            online u par klikova — bez čekanja i poziva.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 mt-8 sm:flex-row sm:justify-center sm:gap-4">
            <Button size="lg" className="h-12 px-6 text-base font-medium" onClick={scrollToSearch}>
              <Search className="w-4 h-4 mr-2" />
              Pronađite salon
            </Button>

            <Button size="lg" variant="outline" className="h-12 px-6 text-base font-medium" asChild>
              <Link href="/saloni">
                <MapPin className="w-4 h-4 mr-2" />
                Pogledajte sve salone
              </Link>
            </Button>
          </div>

          {/* Trust points */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" aria-hidden="true" />
              Pretražite po tipu salona
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
              Saloni u vašem gradu
            </span>
            <span className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" aria-hidden="true" />
              Zakazivanje u par klikova
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
