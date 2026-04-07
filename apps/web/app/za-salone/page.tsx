import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import { getAppUrl } from "@/lib/utils";
import {
  Button,
  CtaBanner,
  FAQSection,
  FeaturesSection,
  HeroSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
  ProcessSection,
  SocialProofBar,
  TestimonialsSection,
  homepageFAQs,
} from "@salonko/ui";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Za salone | Salonko - Online zakazivanje termina",
  description:
    "Automatizujte zakazivanje termina u vašem salonu. Klijenti zakazuju online, vi se posvetite poslu. 30 dana besplatno.",
  openGraph: {
    title: "Za salone | Salonko - Online zakazivanje termina",
    description:
      "Automatizujte zakazivanje termina u vašem salonu. Klijenti zakazuju online, vi se posvetite poslu.",
    url: `${baseUrl}/za-salone`,
    siteName: "Salonko",
    locale: "sr_RS",
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/za-salone`,
  },
};

export default function ZaSalonePage() {
  return (
    <div className="min-h-dvh">
      <OrganizationSchema />
      <WebsiteSchema />
      <LandingHeader variant="owner" />
      <HeroSection imageSrc="/images/hero-dashboard.png" imageAlt="Salonko Dashboard" />
      <SocialProofBar />
      <FeaturesSection />

      {/* Mid-page CTA */}
      <div className="py-12 text-center bg-gray-50 dark:bg-muted/30">
        <p className="text-lg font-medium text-foreground">
          Spremni da probate? Podešavanje traje samo 5 minuta.
        </p>
        <Button size="lg" className="mt-4 h-12 px-6 text-base font-medium" asChild>
          <Link href="/signup">
            Započnite besplatan probni period
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>

      <ProcessSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection items={homepageFAQs} showBackground />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
