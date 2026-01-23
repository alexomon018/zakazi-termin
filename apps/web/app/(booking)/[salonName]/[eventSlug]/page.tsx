import { BreadcrumbSchema, ServiceSchema } from "@/components/StructuredData";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { getAppUrl } from "@/lib/utils";
import { BookingFlow, EventNotFound } from "@salonko/ui";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    salonName: string;
    eventSlug: string;
  }>;
};

const baseUrl = getAppUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonName, eventSlug } = await params;
  const caller = await createPublicServerCaller();

  try {
    const eventType = await caller.eventType.getPublic({
      salonSlug: salonName,
      slug: eventSlug,
    });

    if (!eventType) {
      return {
        title: "Usluga nije pronadjena",
        description: "Ova usluga ne postoji ili vise nije dostupna.",
        robots: { index: false, follow: false },
      };
    }

    const title = `${eventType.title} - ${eventType.user.salonName || salonName}`;
    const description =
      eventType.description ||
      `Zakazite ${eventType.title} (${eventType.length} min) kod ${eventType.user.salonName || salonName}. Online zakazivanje termina putem Salonko platforme.`;
    // Prioritize salonIconUrl (S3) over avatarUrl (Google OAuth)
    const imageUrl = eventType.user.salonIconUrl || eventType.user.avatarUrl;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${salonName}/${eventSlug}`,
        type: "website",
        images: imageUrl ? [{ url: imageUrl, alt: eventType.user.salonName || salonName }] : [],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
      alternates: {
        canonical: `${baseUrl}/${salonName}/${eventSlug}`,
      },
    };
  } catch {
    return {
      title: "Usluga nije pronadjena",
      description: "Ova usluga ne postoji ili vise nije dostupna.",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicBookingPage({ params }: Props) {
  const { salonName, eventSlug } = await params;

  const caller = await createPublicServerCaller();

  try {
    const eventType = await caller.eventType.getPublic({
      salonSlug: salonName,
      slug: eventSlug,
    });

    if (!eventType) {
      return <EventNotFound />;
    }

    return (
      <>
        <ServiceSchema
          name={eventType.title}
          description={eventType.description}
          duration={eventType.length}
          providerName={eventType.user.salonName || salonName}
          providerSalonName={salonName}
          slug={eventSlug}
        />
        <BreadcrumbSchema
          items={[
            { name: "Salonko", url: baseUrl },
            { name: eventType.user.salonName || salonName, url: `${baseUrl}/${salonName}` },
            { name: eventType.title, url: `${baseUrl}/${salonName}/${eventSlug}` },
          ]}
        />
        <BookingFlow eventType={eventType} salonName={salonName} eventSlug={eventSlug} />
      </>
    );
  } catch {
    return <EventNotFound />;
  }
}
