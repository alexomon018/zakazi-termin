import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  LandingHeader,
  HeroSection,
  SocialProofBar,
  FeaturesSection,
  ProcessSection,
  PricingSection,
  CtaBanner,
  LandingFooter,
} from "@zakazi-termin/ui";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection
        imageSrc="/images/hero-dashboard.png"
        imageAlt="Zakaži Termin Dashboard"
      />
      <SocialProofBar />
      <FeaturesSection />
      <ProcessSection />
      <PricingSection />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
