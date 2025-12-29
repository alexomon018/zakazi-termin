"use client";

import { useScrollAnimation } from "@salonko/ui/hooks/useScrollAnimation";
import { cn } from "@salonko/ui/utils";
import { FAQAccordion } from "./FAQAccordion";
import type { FAQItem } from "./faq-data";

interface FAQSectionProps {
  title?: string;
  description?: string;
  items: FAQItem[];
  allowMultiple?: boolean;
  className?: string;
  showBackground?: boolean;
}

export function FAQSection({
  title = "Često postavljena pitanja",
  description = "Kratki odgovori na najčešća pitanja naših korisnika. Ako ti nešto i dalje nije jasno, uvek nam možeš pisati.",
  items,
  allowMultiple = false,
  className,
  showBackground = false,
}: FAQSectionProps) {
  const headerRef = useScrollAnimation({ threshold: 0.2, triggerOnce: true });

  return (
    <section
      id="faq"
      className={cn(
        "py-20 px-4 sm:px-6 lg:px-8 lg:py-28",
        showBackground && "bg-muted/30",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        <div
          ref={headerRef.ref}
          className={cn(
            "mb-12 text-center transition-all duration-700 ease-out",
            headerRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <h2 className="mb-4 text-3xl font-bold text-foreground text-balance sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            {description}
          </p>
        </div>

        <FAQAccordion items={items} allowMultiple={allowMultiple} />
      </div>
    </section>
  );
}
