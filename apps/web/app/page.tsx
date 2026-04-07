import { SalonDiscoverySectionContainer } from "@/components/SalonDiscoverySectionContainer";
import { OrganizationSchema, WebsiteSchema } from "@/components/StructuredData";
import { getSession } from "@/lib/auth";
import { TRPCProvider } from "@/lib/trpc/provider";
import {
  FAQSection,
  LandingFooter,
  LandingHeader,
  SalonCategoriesSection,
  UserHeroSection,
  UserProcessSection,
  userFAQs,
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
      <UserHeroSection />
      <TRPCProvider>
        <SalonDiscoverySectionContainer />
      </TRPCProvider>
      <SalonCategoriesSection />
      <UserProcessSection />
      <FAQSection
        title="Pitanja i odgovori"
        description="Sve što treba da znate o zakazivanju termina preko Salonko platforme."
        items={userFAQs}
        showBackground
      />
      <LandingFooter />
    </div>
  );
}
