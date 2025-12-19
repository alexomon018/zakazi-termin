import * as React from "react";
import { PricingCard } from "../../molecules/landing/PricingCard";

export function PricingSection() {
  const plans = [
    {
      plan: "Starter",
      price: "1.500",
      period: "RSD/mes",
      description: "Savršeno za male salone",
      features: [
        "1 zaposleni",
        "100 termina mesečno",
        "SMS podsetnici",
        "Mobilna aplikacija",
      ],
      buttonText: "Probaj besplatno",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
    {
      plan: "Professional",
      price: "3.500",
      period: "RSD/mes",
      description: "Za rastući biznis",
      features: [
        "Do 5 zaposlenih",
        "Neograničeni termini",
        "SMS i email podsetnici",
        "Analitika i izveštaji",
        "Online plaćanja",
      ],
      buttonText: "Počni odmah",
      buttonVariant: "default" as const,
      badge: "Najpopularnije",
      highlighted: true,
    },
    {
      plan: "Enterprise",
      price: "7.000",
      period: "RSD/mes",
      description: "Za lance salona",
      features: [
        "Neograničeni zaposleni",
        "Više lokacija",
        "Sve Professional funkcije",
        "Prilagođen brend",
        "Podrška 24/7",
      ],
      buttonText: "Kontaktirajte nas",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
  ];

  return (
    <section id="cene" className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Pristupačne cene za svaki biznis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Bez skrivenih troškova. Otkažite bilo kada.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              plan={plan.plan}
              price={plan.price}
              period={plan.period}
              description={plan.description}
              features={plan.features}
              buttonText={plan.buttonText}
              buttonVariant={plan.buttonVariant}
              badge={plan.badge}
              highlighted={plan.highlighted}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
