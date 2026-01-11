"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { ArrowRight, Check, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  imageSrc: string;
  imageAlt: string;
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function HeroSection({ imageSrc, imageAlt, onStartClick, onDemoClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,#1a1a2e_1px,transparent_1px),linear-gradient(to_bottom,#1a1a2e_1px,transparent_1px)] opacity-40" />

      <div className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Content */}
          <div className="max-w-xl">
            {/* Trust indicator - subtle badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-sm font-medium rounded-full bg-primary/5 text-primary dark:bg-primary/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              30 dana besplatno, bez kartice
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Zakazivanje termina, <span className="text-primary">jednostavno</span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Omogućite klijentima da sami zakazuju termine online — 24/7. Manje poziva, manje
              propuštenih termina, više vremena za ono što je važno.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 mt-8 sm:flex-row sm:gap-4">
              {onStartClick ? (
                <Button
                  size="lg"
                  className="h-12 px-6 text-base font-medium"
                  onClick={onStartClick}
                >
                  Započnite besplatno
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button size="lg" className="h-12 px-6 text-base font-medium" asChild>
                  <Link href="/signup">
                    Započnite besplatno
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}

              {onDemoClick ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-base font-medium"
                  onClick={onDemoClick}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Pogledajte kako radi
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-base font-medium"
                  asChild
                >
                  <Link href="#demo">
                    <Play className="w-4 h-4 mr-2" />
                    Pogledajte kako radi
                  </Link>
                </Button>
              )}
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                Bez kreditne kartice
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                Podešavanje za 5 min
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                Otkažite bilo kada
              </span>
            </div>
          </div>

          {/* Right: Product Screenshot */}
          <div className="relative">
            {/* Browser frame for screenshot */}
            <div className="overflow-hidden bg-white rounded-xl shadow-2xl ring-1 ring-gray-900/5 dark:bg-card dark:ring-white/10">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50 dark:bg-muted border-gray-100 dark:border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="flex items-center h-7 px-3 text-xs text-muted-foreground bg-white dark:bg-background rounded-md border border-gray-200 dark:border-border">
                    salonko.rs/vas-salon
                  </div>
                </div>
              </div>
              {/* Screenshot */}
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={1088}
                height={960}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Floating card - subtle social proof */}
            <div className="absolute -left-4 bottom-12 hidden lg:block">
              <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-lg ring-1 ring-gray-900/5 dark:bg-card dark:ring-white/10">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 ring-2 ring-white dark:ring-card" />
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 ring-2 ring-white dark:ring-card" />
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 ring-2 ring-white dark:ring-card" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-foreground">Aktivno koristi</p>
                  <p className="text-muted-foreground">100+ salona u Srbiji</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
