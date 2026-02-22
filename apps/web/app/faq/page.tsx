import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData";
import { getAppUrl } from "@/lib/utils";
import {
  FAQSection,
  LandingFooter,
  LandingHeader,
  clientFAQs,
  generalFAQs,
  salonOwnerFAQs,
} from "@salonko/ui";
import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Često postavljena pitanja",
  description:
    "Pronađi odgovore na najčešća pitanja o Salonko platformi za online zakazivanje termina.",
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
  openGraph: {
    title: "Često postavljena pitanja",
    description:
      "Pronađi odgovore na najčešća pitanja o Salonko platformi za online zakazivanje termina.",
    url: `${baseUrl}/faq`,
    type: "website",
    siteName: "Salonko",
    locale: "sr_RS",
  },
  twitter: {
    card: "summary",
    title: "Često postavljena pitanja",
    description:
      "Pronađi odgovore na najčešća pitanja o Salonko platformi za online zakazivanje termina.",
  },
};

export default function FAQPage() {
  const allFAQItems = [...generalFAQs, ...salonOwnerFAQs, ...clientFAQs];

  return (
    <div className="min-h-dvh">
      <BreadcrumbSchema
        items={[
          { name: "Početna", url: baseUrl },
          { name: "Često postavljena pitanja", url: `${baseUrl}/faq` },
        ]}
      />
      <FAQSchema items={allFAQItems} />
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
            <Link
              href="/help/podrska"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Kontaktiraj podršku
            </Link>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
