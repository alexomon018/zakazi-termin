import { BreadcrumbSchema } from "@/components/StructuredData";
import { getAppUrl } from "@/lib/utils";
import { LandingFooter, LandingHeader, SupportRequestClient } from "@salonko/ui";
import type { Metadata } from "next";
import { submitSupportRequest } from "./actions";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Kontaktiraj podršku",
  description:
    "Pošalji zahtev za podršku Salonko timu. Odgovaramo u roku od 24 sata radnim danima.",
  alternates: {
    canonical: `${baseUrl}/help/podrska`,
  },
  openGraph: {
    title: "Kontaktiraj podršku",
    description:
      "Pošalji zahtev za podršku Salonko timu. Odgovaramo u roku od 24 sata radnim danima.",
    url: `${baseUrl}/help/podrska`,
    type: "website",
    siteName: "Salonko",
    locale: "sr_RS",
  },
  twitter: {
    card: "summary",
    title: "Kontaktiraj podršku",
    description:
      "Pošalji zahtev za podršku Salonko timu. Odgovaramo u roku od 24 sata radnim danima.",
  },
};

export default function SupportRequestPage() {
  return (
    <div className="min-h-dvh">
      <BreadcrumbSchema
        items={[
          { name: "Početna", url: baseUrl },
          { name: "Centar za pomoć", url: `${baseUrl}/help` },
          { name: "Kontaktiraj podršku", url: `${baseUrl}/help/podrska` },
        ]}
      />
      <LandingHeader />
      <main>
        <SupportRequestClient onSubmit={submitSupportRequest} />
      </main>
      <LandingFooter />
    </div>
  );
}
