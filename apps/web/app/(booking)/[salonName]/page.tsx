import { BreadcrumbSchema, LocalBusinessSchema } from "@/components/StructuredData";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { getAppUrl } from "@/lib/utils";
import { UserNotFound, UserProfileClient } from "@salonko/ui";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ salonName: string }>;
};

const baseUrl = getAppUrl();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { salonName } = await params;
  const caller = await createPublicServerCaller();
  const user = await caller.user.getPublicProfile({ salonName });

  if (!user) {
    return {
      title: "Korisnik nije pronadjen",
      description: "Ovaj korisnik ne postoji na Salonko platformi.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${user.salonName || salonName} - Zakazite termin`;
  const description = `Zakazite termin kod ${user.salonName || salonName} online. Brzo i jednostavno zakazivanje termina putem Salonko platforme.`;
  // Prioritize salonIconUrl (S3) over avatarUrl (Google OAuth)
  const imageUrl = user.salonIconUrl || user.avatarUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${salonName}`,
      type: "profile",
      images: imageUrl ? [{ url: imageUrl, alt: user.salonName || salonName }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${baseUrl}/${salonName}`,
    },
  };
}

export default async function UserBookingPage({ params }: Props) {
  const { salonName } = await params;

  const caller = await createPublicServerCaller();

  // Fetch user's public profile
  const user = await caller.user.getPublicProfile({ salonName });

  if (!user) {
    return <UserNotFound />;
  }

  return (
    <>
      <LocalBusinessSchema
        name={user.salonName || salonName}
        salonName={salonName}
        avatarUrl={user.salonIconUrl || user.avatarUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: "Salonko", url: baseUrl },
          { name: user.salonName || salonName, url: `${baseUrl}/${salonName}` },
        ]}
      />
      <UserProfileClient user={user} salonName={salonName} />
    </>
  );
}
