import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import { getSession } from "@/lib/auth";
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
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh">
      <OrganizationSchema />
      <WebsiteSchema />
      <LandingHeader />
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
