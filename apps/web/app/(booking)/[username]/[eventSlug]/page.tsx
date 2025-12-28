import { BreadcrumbSchema, ServiceSchema } from "@/components/StructuredData";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { getAppUrl } from "@/lib/utils";
import { BookingFlow, EventNotFound } from "@salonko/ui";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    username: string;
    eventSlug: string;
  }>;
};

const baseUrl = getAppUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, eventSlug } = await params;
  const caller = await createPublicServerCaller();

  try {
    const eventType = await caller.eventType.getPublic({
      username,
      slug: eventSlug,
    });

    if (!eventType) {
      return {
        title: "Usluga nije pronadjena",
        description: "Ova usluga ne postoji ili vise nije dostupna.",
        robots: { index: false, follow: false },
      };
    }

    const title = `${eventType.title} - ${eventType.user.name || username}`;
    const description =
      eventType.description ||
      `Zakazite ${eventType.title} (${eventType.length} min) kod ${eventType.user.name || username}. Online zakazivanje termina putem Salonko platforme.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/${username}/${eventSlug}`,
        type: "website",
        images: eventType.user.avatarUrl
          ? [{ url: eventType.user.avatarUrl, alt: eventType.user.name || username }]
          : [],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: eventType.user.avatarUrl ? [eventType.user.avatarUrl] : [],
      },
      alternates: {
        canonical: `${baseUrl}/${username}/${eventSlug}`,
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
  const { username, eventSlug } = await params;

  const caller = await createPublicServerCaller();

  try {
    const eventType = await caller.eventType.getPublic({
      username,
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
          providerName={eventType.user.name || username}
          providerUsername={username}
          slug={eventSlug}
        />
        <BreadcrumbSchema
          items={[
            { name: "Salonko", url: baseUrl },
            { name: eventType.user.name || username, url: `${baseUrl}/${username}` },
            { name: eventType.title, url: `${baseUrl}/${username}/${eventSlug}` },
          ]}
        />
        <BookingFlow eventType={eventType} username={username} eventSlug={eventSlug} />
      </>
    );
  } catch {
    return <EventNotFound />;
  }
}
