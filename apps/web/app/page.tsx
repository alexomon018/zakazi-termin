import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import { getSession } from "@/lib/auth";
import {
  CtaBanner,
  FAQSection,
  FeaturesSection,
  HeroSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
  ProcessSection,
  SocialProofBar,
  homepageFAQs,
} from "@salonko/ui";
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
      <ProcessSection />
      <PricingSection />
      <FAQSection items={homepageFAQs} showBackground />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
