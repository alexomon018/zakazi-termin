"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@salonko/ui/atoms/Button";
import { Card } from "@salonko/ui/atoms/Card";
import { TrialBadge } from "@salonko/ui/molecules/landing/TrialBadge";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";

interface HeroSectionProps {
  imageSrc: string;
  imageAlt: string;
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function HeroSection({ imageSrc, imageAlt, onStartClick, onDemoClick }: HeroSectionProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div
            ref={ref}
            className={cn(
              "transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <TrialBadge>Besplatno probaj 30 dana</TrialBadge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-balance leading-tight mt-6">
              <span className="gradient-text">Olakšajte zakazivanje termina</span>{" "}
              <span className="text-foreground">vašim klijentima</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
              Prestanite da gubite vreme na telefonske pozive. Omogućite klijentima da samostalno
              zakazuju termine online - 24/7, sa bilo kog uređaja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {onStartClick ? (
                <Button
                  size="lg"
                  className="text-base transition-all duration-200 hover:scale-105 hover:shadow-glow"
                  onClick={onStartClick}
                >
                  Počnite besplatno
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-glow h-11 px-8 group"
                >
                  Počnite besplatno
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {onDemoClick ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base bg-transparent transition-all duration-200 hover:scale-105 hover:bg-accent/50"
                  onClick={onDemoClick}
                >
                  Pogledajte demo
                </Button>
              ) : (
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:scale-105 h-11 px-8"
                >
                  Pogledajte demo
                </Link>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Bez potrebe za kreditnom karticom · Podešavanje za 5 minuta
            </p>
          </div>
          <div className="relative">
            <Card className="p-8 shadow-elevated-lg hover:shadow-glow transition-shadow duration-300">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={1088}
                height={960}
                className="w-full h-auto rounded-lg transition-transform duration-300 hover:scale-[1.02]"
                priority
              />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
