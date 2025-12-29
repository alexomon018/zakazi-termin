"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@salonko/ui/atoms/Accordion";
import { cn } from "@salonko/ui/utils";
import type { FAQItem } from "./faq-data";

interface FAQAccordionProps {
  items: FAQItem[];
  allowMultiple?: boolean;
  className?: string;
  defaultValue?: string;
}

function generateItemId(question: string): string {
  return question
    .toLowerCase()
    .slice(0, 50)
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function FAQAccordion({
  items,
  allowMultiple = false,
  className,
  defaultValue,
}: FAQAccordionProps) {
  const firstItemId = items[0] ? generateItemId(items[0].question) : undefined;

  if (allowMultiple) {
    return (
      <Accordion
        type="multiple"
        defaultValue={defaultValue ? [defaultValue] : firstItemId ? [firstItemId] : []}
        className={cn("w-full", className)}
      >
        {items.map((item) => {
          const itemId = generateItemId(item.question);
          return (
            <AccordionItem key={itemId} value={itemId} className="border-border">
              <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline hover:text-primary sm:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultValue ?? firstItemId}
      className={cn("w-full", className)}
    >
      {items.map((item) => {
        const itemId = generateItemId(item.question);
        return (
          <AccordionItem key={itemId} value={itemId} className="border-border">
            <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline hover:text-primary sm:text-lg">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
