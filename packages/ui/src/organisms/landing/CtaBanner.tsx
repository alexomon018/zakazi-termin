"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface CtaBannerProps {
  onStartClick?: () => void;
  onDemoClick?: () => void;
}

export function CtaBanner({ onStartClick, onDemoClick }: CtaBannerProps) {
  return (
    <section className="py-16 bg-primary dark:bg-primary lg:py-24">
      <div className="px-4 mx-auto max-w-4xl sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
          Spremni da unapredite zakazivanje?
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Pridružite se vlasnicima salona koji su automatizovali termine i vratili sebi vreme.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 mt-8 sm:flex-row">
          {onStartClick ? (
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-6 text-base font-medium"
              onClick={onStartClick}
            >
              Započnite besplatno
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="h-12 px-6 text-base font-medium"
              asChild
            >
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
              className="h-12 px-6 text-base font-medium text-white border-white/30 bg-white/10 hover:bg-white/20"
              onClick={onDemoClick}
            >
              Pogledajte demo
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base font-medium text-white border-white/30 bg-white/10 hover:bg-white/20"
              asChild
            >
              <Link href="#demo">Pogledajte demo</Link>
            </Button>
          )}
        </div>

        <p className="mt-6 text-sm text-white/60">Bez obaveza · Podrška na srpskom</p>
      </div>
    </section>
  );
}
