import { BreadcrumbSchema, FAQSchema, VerticalLandingSchema } from "@/components/StructuredData";
import { getAppUrl } from "@/lib/utils";
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
  VERTICALS,
  VERTICAL_SLUGS,
} from "@salonko/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

const baseUrl = getAppUrl();

function resolveVertical(slug: string) {
  return VERTICALS[slug];
}

export function generateStaticParams() {
  return VERTICAL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vertical = resolveVertical(slug);
  if (!vertical) return {};

  return {
    title: vertical.title,
    description: vertical.description,
    keywords: vertical.keywords,
    openGraph: {
      type: "website",
      locale: "sr_RS",
      url: `${baseUrl}/za-salone/${slug}`,
      siteName: "Salonko",
      title: vertical.ogTitle,
      description: vertical.ogDescription,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: vertical.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: vertical.ogTitle,
      description: vertical.ogDescription,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `${baseUrl}/za-salone/${slug}`,
    },
  };
}

export default async function VerticalLandingPage({ params }: Props) {
  const { slug } = await params;
  const vertical = resolveVertical(slug);
  if (!vertical) notFound();

  return (
    <div className="min-h-dvh">
      <VerticalLandingSchema
        title={vertical.title}
        serviceType={vertical.serviceType}
        serviceDescription={vertical.serviceDescription}
        slug={slug}
      />
      <BreadcrumbSchema
        items={[
          { name: "Salonko", url: baseUrl },
          { name: vertical.title, url: `${baseUrl}/za-salone/${slug}` },
        ]}
      />
      <FAQSchema items={vertical.faqItems} />
      <LandingHeader />
      <HeroSection
        headline={vertical.heroHeadline}
        highlightText={vertical.heroHighlight}
        subheading={vertical.heroSubheading}
        imageSrc="/images/hero-dashboard.png"
        imageAlt={vertical.heroImageAlt}
      />
      <SocialProofBar />
      <FeaturesSection
        title={vertical.featuresTitle}
        subtitle={vertical.featuresSubtitle}
        features={vertical.features}
      />
      <ProcessSection />
      <PricingSection />
      <FAQSection
        title={vertical.faqTitle}
        description={vertical.faqDescription}
        items={vertical.faqItems}
        showBackground
      />
      <CtaBanner headline={vertical.ctaHeadline} subheading={vertical.ctaSubheading} />
      <LandingFooter />
    </div>
  );
}
