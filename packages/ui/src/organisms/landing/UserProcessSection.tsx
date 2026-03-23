import { CalendarCheck, MousePointerClick, Search } from "lucide-react";

const steps = [
  {
    step: 1,
    icon: Search,
    title: "Pronađite salon",
    description: "Pretražite salone po imenu, tipu usluge ili gradu i izaberite omiljeni.",
  },
  {
    step: 2,
    icon: MousePointerClick,
    title: "Izaberite termin",
    description: "Pregledajte slobodne termine i izaberite dan i vreme koje vam odgovara.",
  },
  {
    step: 3,
    icon: CalendarCheck,
    title: "Zakažite online",
    description: "Potvrdite termin u par klikova — bez poziva, čekanja ili poruka.",
  },
];

export function UserProcessSection() {
  return (
    <section className="py-20 lg:py-28 bg-muted/50 dark:bg-muted/30">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary">
            Kako funkcioniše
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Zakažite termin u 3 koraka
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Brzo, jednostavno i bez komplikacija.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-8 mt-16 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.step} className="relative text-center">
              {/* Connector line (hidden on mobile, visible on desktop) */}
              {index < steps.length - 1 && (
                <div className="absolute hidden md:block top-8 left-[60%] w-[80%] h-px bg-border" />
              )}

              {/* Step number with icon */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-card ring-1 ring-border">
                <step.icon className="w-7 h-7 text-primary" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full bg-primary">
                  {step.step}
                </span>
              </div>

              <h3 className="mt-6 text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-muted-foreground max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
