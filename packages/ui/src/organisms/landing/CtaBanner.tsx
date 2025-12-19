"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "../../atoms/Button";

interface CtaBannerProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function CtaBanner({ onStartClick, onDemoClick }: CtaBannerProps) {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-balance">
          Spremni da preuzmete kontrolu nad terminima?
        </h2>
        <p className="text-lg sm:text-xl mb-8 text-primary-foreground/90 text-pretty">
          Pridružite se stotinama zadovoljnih vlasnika salona koji štede vreme
          i povećavaju prihode sa Zakaži Termin platformom.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {onStartClick ? (
            <Button
              size="lg"
              variant="secondary"
              className="text-base"
              onClick={onStartClick}
            >
              Započnite besplatno probno razdoblje
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-11 px-8"
            >
              Započnite besplatno probno razdoblje
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          )}
          {onDemoClick ? (
            <Button
              size="lg"
              variant="outline"
              className="text-base border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={onDemoClick}
            >
              Zakažite demo
            </Button>
          ) : (
            <Link
              href="#"
              className="inline-flex items-center justify-center rounded-md text-base font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 h-11 px-8"
            >
              Zakažite demo
            </Link>
          )}
        </div>
        <p className="text-sm text-primary-foreground/70 mt-6">
          Bez obaveza · Podrška na srpskom jeziku
        </p>
      </div>
    </section>
  );
}
