import {
  FAQSection,
  LandingFooter,
  LandingHeader,
  clientFAQs,
  generalFAQs,
  salonOwnerFAQs,
} from "@salonko/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Često postavljena pitanja | Salonko",
  description:
    "Pronađi odgovore na najčešća pitanja o Salonko platformi za online zakazivanje termina.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <FAQSection
          title="Često postavljena pitanja"
          description="Kratki odgovori na najčešća pitanja naših korisnika. Ako ti nešto i dalje nije jasno, uvek nam možeš pisati."
          items={generalFAQs}
          allowMultiple
        />

        <FAQSection
          title="Pitanja za vlasnike"
          description="Odgovori na sve što treba da znaš pre nego što počneš da koristiš Salonko za svoje poslovanje."
          items={salonOwnerFAQs}
          showBackground
          allowMultiple
        />

        <FAQSection
          title="Pitanja za klijente"
          description="Sve što klijenti treba da znaju o zakazivanju termina."
          items={clientFAQs}
          allowMultiple
        />

        <section className="px-4 py-16 text-center sm:px-6 lg:px-8 bg-muted/30">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-2xl font-bold text-foreground">Imaš još pitanja?</h2>
            <p className="mb-6 text-muted-foreground">
              Ako nisi pronašao odgovor na svoje pitanje, slobodno nas kontaktiraj. Tu smo da
              pomognemo!
            </p>
            <a
              href="mailto:salonko.rs@gmail.com"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Kontaktiraj nas
            </a>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
