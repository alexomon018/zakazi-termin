"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "../../atoms/Button";
import { Card } from "../../atoms/Card";
import { TrialBadge } from "../../molecules/landing/TrialBadge";

interface HeroSectionProps {
  imageSrc: string;
  imageAlt: string;
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function HeroSection({
  imageSrc,
  imageAlt,
  onStartClick,
  onDemoClick,
}: HeroSectionProps) {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <TrialBadge>Besplatno probaj 14 dana</TrialBadge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 text-balance leading-tight mt-6">
              Olakšajte zakazivanje termina vašim klijentima
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 text-pretty leading-relaxed">
              Prestanite da gubite vreme na telefonske pozive. Omogućite
              klijentima da samostalno zakazuju termine online - 24/7, sa bilo
              kog uređaja.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {onStartClick ? (
                <Button size="lg" className="text-base" onClick={onStartClick}>
                  Počnite besplatno
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                >
                  Počnite besplatno
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              )}
              {onDemoClick ? (
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base bg-transparent"
                  onClick={onDemoClick}
                >
                  Pogledajte demo
                </Button>
              ) : (
                <Link
                  href="#"
                  className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-11 px-8"
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
            <Card className="p-8 shadow-2xl">
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={1088}
                height={960}
                className="w-full h-auto rounded-lg"
                priority
              />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
