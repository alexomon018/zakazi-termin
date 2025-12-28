import { BreadcrumbSchema, LocalBusinessSchema } from "@/components/StructuredData";
import { createPublicServerCaller } from "@/lib/trpc/server";
import { UserNotFound, UserProfileClient } from "@salonko/ui";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const caller = await createPublicServerCaller();
  const user = await caller.user.getPublicProfile({ username });

  if (!user) {
    return {
      title: "Korisnik nije pronadjen",
      description: "Ovaj korisnik ne postoji na Salonko platformi.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${user.name || username} - Zakazite termin`;
  const description = `Zakazite termin kod ${user.name || username} online. Brzo i jednostavno zakazivanje termina putem Salonko platforme.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://salonko.rs/${username}`,
      type: "profile",
      images: user.avatarUrl ? [{ url: user.avatarUrl, alt: user.name || username }] : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: user.avatarUrl ? [user.avatarUrl] : [],
    },
    alternates: {
      canonical: `https://salonko.rs/${username}`,
    },
  };
}

export default async function UserBookingPage({ params }: Props) {
  const { username } = await params;

  const caller = await createPublicServerCaller();

  // Fetch user's public profile
  const user = await caller.user.getPublicProfile({ username });

  if (!user) {
    return <UserNotFound />;
  }

  return (
    <>
      <LocalBusinessSchema
        name={user.name || username}
        username={username}
        avatarUrl={user.avatarUrl}
      />
      <BreadcrumbSchema
        items={[
          { name: "Salonko", url: "https://salonko.rs" },
          { name: user.name || username, url: `https://salonko.rs/${username}` },
        ]}
      />
      <UserProfileClient user={user} username={username} />
    </>
  );
}
