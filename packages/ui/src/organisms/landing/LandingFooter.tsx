"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { FooterColumn } from "../../molecules/landing/FooterColumn";

export function LandingFooter() {
  const productLinks = [
    { label: "Funkcije", href: "#funkcije" },
    { label: "Cene", href: "#cene" },
    { label: "Demo", href: "#" },
  ];

  const supportLinks = [
    { label: "Pomoć", href: "#" },
    { label: "Kontakt", href: "#" },
    { label: "FAQ", href: "#" },
  ];

  const legalLinks = [
    { label: "Uslovi korišćenja", href: "#" },
    { label: "Privatnost", href: "#" },
  ];

  return (
    <footer
      id="kontakt"
      className="border-t border-border bg-card py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">
                Zakaži Termin
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Moderna platforma za zakazivanje termina za frizerske, kozmetičke
              i beauty salone.
            </p>
          </div>
          <FooterColumn title="Proizvod" links={productLinks} />
          <FooterColumn title="Podrška" links={supportLinks} />
          <FooterColumn title="Pravno" links={legalLinks} />
        </div>
        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © 2025 Zakaži Termin. Sva prava zadržana.
        </div>
      </div>
    </footer>
  );
}
