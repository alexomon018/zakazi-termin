import { getSession } from "@/lib/auth";
import {
  CtaBanner,
  FeaturesSection,
  HeroSection,
  LandingFooter,
  LandingHeader,
  PricingSection,
  ProcessSection,
  SocialProofBar,
} from "@salonko/ui";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <LandingHeader />
      <HeroSection imageSrc="/images/hero-dashboard.png" imageAlt="Salonko Dashboard" />
      <SocialProofBar />
      <FeaturesSection />
      <ProcessSection />
      <PricingSection />
      <CtaBanner />
      <LandingFooter />
    </div>
  );
}
