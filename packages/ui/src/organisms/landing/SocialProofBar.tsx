"use client";

import { Calendar, CreditCard, Mail, MessageSquare } from "lucide-react";

const integrations = [
  { name: "Google Calendar", icon: Calendar },
  { name: "Stripe", icon: CreditCard },
  { name: "Email", icon: Mail },
  { name: "SMS", icon: MessageSquare },
];

export function SocialProofBar() {
  return (
    <section className="py-8 border-y border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/30">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row md:gap-12">
          <p className="text-sm font-medium text-muted-foreground">Integracije koje podržavamo</p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center gap-2 text-muted-foreground">
                <integration.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
