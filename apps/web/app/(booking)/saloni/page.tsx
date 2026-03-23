import { getAppUrl } from "@/lib/utils";
import { LandingFooter, LandingHeader, SalonListingClient } from "@salonko/ui";
import type { Metadata } from "next";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Svi saloni | Salonko",
  description:
    "Pronađite i zakažite termin u najboljim salonima. Frizerski saloni, kozmetički saloni, masaže, spa centri i još mnogo toga.",
  openGraph: {
    title: "Svi saloni | Salonko",
    description:
      "Pronađite i zakažite termin u najboljim salonima. Frizerski saloni, kozmetički saloni, masaže, spa centri i još mnogo toga.",
    url: `${baseUrl}/saloni`,
    siteName: "Salonko",
    locale: "sr_RS",
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/saloni`,
  },
};

export default function SaloniPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <SalonListingClient />
      </main>
      <LandingFooter />
    </div>
  );
}
