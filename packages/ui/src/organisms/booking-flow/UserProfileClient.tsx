"use client";

import { normalizeToSlug } from "@salonko/config";
import { Card, CardContent } from "@salonko/ui";
import { ArrowRight, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type EventType = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  locations: unknown;
  user?: {
    id: string;
    name: string | null;
    salonName: string | null;
  } | null;
};

type UserProfile = {
  id: string;
  name: string | null;
  salonName: string | null;
  avatarUrl: string | null;
  salonIconUrl?: string | null;
  theme?: string | null;
  brandColor?: string | null;
  darkBrandColor?: string | null;
  eventTypes: EventType[];
  isOrganization?: boolean;
};

type UserProfileClientProps = {
  user: UserProfile;
  salonName: string;
};

export function UserProfileClient({ user, salonName }: UserProfileClientProps) {
  const visibleEventTypes = user.eventTypes?.filter((et) => !et.hidden) || [];
  const brandColor = user.brandColor || "#292929";
  const darkBrandColor = user.darkBrandColor || "#fafafa";
  // Only use the dedicated salon icon on booking pages - never the user's Google avatar
  const effectiveAvatarUrl = user.salonIconUrl;

  return (
    <div
      className="px-4 py-12 min-h-screen bg-background"
      style={
        {
          "--brand-color": brandColor,
          "--brand-color-dark": darkBrandColor,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-2xl">
        {/* User profile header */}
        <div className="mb-8 text-center">
          {effectiveAvatarUrl ? (
            <Image
              src={effectiveAvatarUrl}
              alt={user.salonName || ""}
              width={80}
              height={80}
              className="object-cover mx-auto mb-4 w-20 h-20 rounded-full"
            />
          ) : (
            <div className="flex justify-center items-center mx-auto mb-4 w-20 h-20 rounded-full bg-brand/10">
              <User className="w-10 h-10 text-brand" />
            </div>
          )}
          <h1 data-testid="public-profile-name" className="text-2xl font-bold text-foreground">
            {user.salonName}
          </h1>
        </div>

        {/* Event types list */}
        {visibleEventTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Ovaj korisnik nema aktivne tipove termina.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleEventTypes.map((eventType) => (
              <Link
                key={eventType.id}
                href={`/${normalizeToSlug(salonName)}/${eventType.slug}`}
                className="block"
              >
                <Card className="transition-shadow cursor-pointer hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex items-stretch p-5 min-h-[88px]">
                      {/* Color indicator */}
                      <div className="w-1 rounded-full bg-brand" />

                      {/* Event info */}
                      <div className="flex flex-col flex-1 justify-center ml-4">
                        <h3 className="font-semibold text-foreground">{eventType.title}</h3>
                        {eventType.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                            {eventType.description}
                          </p>
                        )}
                        <div className="flex gap-4 items-center mt-2 text-sm text-muted-foreground">
                          <span className="flex gap-1 items-center">
                            <Clock className="w-3.5 h-3.5" />
                            {eventType.length < 60
                              ? `${eventType.length} min`
                              : `${eventType.length / 60}h`}
                          </span>
                          {eventType.locations &&
                          (eventType.locations as { address?: string }[])[0]?.address ? (
                            <span className="flex gap-1 items-center">
                              <MapPin className="w-3.5 h-3.5" />
                              Uživo
                            </span>
                          ) : null}
                          {eventType.user?.name && (
                            <span className="flex gap-1 items-center">
                              <User className="w-3.5 h-3.5" />
                              {eventType.user.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-muted-foreground">
          Pokreće{" "}
          <Link href="/" className="text-primary hover:underline">
            Salonko
          </Link>
        </div>
      </div>
    </div>
  );
}

export function UserNotFound() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="mx-auto max-w-md">
        <CardContent className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Korisnik nije pronađen</h2>
          <p className="text-muted-foreground">
            Ovaj korisnik ne postoji ili nema javne tipove termina.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
