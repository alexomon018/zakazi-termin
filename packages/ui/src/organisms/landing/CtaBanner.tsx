"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CtaBannerProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function CtaBanner({ onStartClick, onDemoClick }: CtaBannerProps) {
  const { ref, isVisible } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section className="overflow-hidden relative px-4 py-12 sm:py-16 lg:py-28 sm:px-6 lg:px-8 bg-gradient-primary text-primary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div
          ref={ref}
          className={cn(
            "transition-all duration-700 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl lg:text-5xl sm:mb-6 text-balance">
            Spremni da preuzmete kontrolu nad terminima?
          </h2>
          <p className="px-2 mb-6 text-base sm:text-lg lg:text-xl sm:mb-8 text-primary-foreground/90 text-pretty sm:px-0">
            Pridružite se stotinama zadovoljnih vlasnika salona koji štede vreme i povećavaju
            prihode sa Salonko platformom.
          </p>
          <div className="flex flex-col gap-3 justify-center items-stretch sm:flex-row sm:gap-4 sm:items-center">
            {onStartClick ? (
              <Button
                size="lg"
                variant="secondary"
                className="px-4 w-full text-sm whitespace-normal transition-all duration-200 sm:text-base hover:scale-105 hover:shadow-elevated-lg group sm:w-auto sm:whitespace-nowrap sm:px-8"
                onClick={onStartClick}
              >
                <span className="text-center">Započnite besplatno probno razdoblje</span>
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
              </Button>
            ) : (
              <Link
                href="/signup"
                className="inline-flex justify-center items-center px-4 w-full h-11 text-sm font-medium whitespace-normal rounded-md transition-all duration-200 sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 hover:shadow-elevated-lg sm:px-8 group sm:w-auto sm:whitespace-nowrap"
              >
                <span className="text-center">Započnite besplatno probno razdoblje</span>
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" />
              </Link>
            )}
            {onDemoClick ? (
              <Button
                size="lg"
                variant="outline"
                className="px-4 w-full text-sm transition-all duration-200 sm:text-base border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:scale-105 sm:w-auto sm:px-8"
                onClick={onDemoClick}
              >
                Zakažite demo
              </Button>
            ) : (
              <Link
                href="#"
                className="inline-flex justify-center items-center px-4 w-full h-11 text-sm font-medium rounded-md border transition-all duration-200 sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:scale-105 sm:px-8 sm:w-auto"
              >
                Zakažite demo
              </Link>
            )}
          </div>
          <p className="px-2 mt-4 text-xs sm:text-sm text-primary-foreground/70 sm:mt-6 sm:px-0">
            Bez obaveza · Podrška na srpskom jeziku
          </p>
        </div>
      </div>
    </section>
  );
}
