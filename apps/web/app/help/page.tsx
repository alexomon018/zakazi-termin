import { BreadcrumbSchema } from "@/components/StructuredData";
import { getAppUrl } from "@/lib/utils";
import { HelpCenterClient, LandingFooter, LandingHeader } from "@salonko/ui";
import type { Metadata } from "next";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Centar za pomoć",
  description:
    "Pronađi odgovore na pitanja o korišćenju Salonko platforme. Vodiči, uputstva i podrška za vlasnike salona.",
  alternates: {
    canonical: `${baseUrl}/help`,
  },
  openGraph: {
    title: "Centar za pomoć",
    description:
      "Pronađi odgovore na pitanja o korišćenju Salonko platforme. Vodiči, uputstva i podrška za vlasnike salona.",
    url: `${baseUrl}/help`,
    type: "website",
    siteName: "Salonko",
    locale: "sr_RS",
  },
  twitter: {
    card: "summary",
    title: "Centar za pomoć",
    description:
      "Pronađi odgovore na pitanja o korišćenju Salonko platforme. Vodiči, uputstva i podrška za vlasnike salona.",
  },
};

export default function HelpCenterPage() {
  return (
    <div className="min-h-dvh">
      <BreadcrumbSchema
        items={[
          { name: "Početna", url: baseUrl },
          { name: "Centar za pomoć", url: `${baseUrl}/help` },
        ]}
      />
      <LandingHeader />
      <main>
        <HelpCenterClient />
      </main>
      <LandingFooter />
    </div>
  );
}
