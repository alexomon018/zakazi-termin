"use client";

import { Card, CardContent } from "@salonko/ui";
import { ArrowRight, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type EventType = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  hidden: boolean;
  locations: unknown;
};

type UserProfile = {
  id: number;
  name: string | null;
  salonName: string | null;
  avatarUrl: string | null;
  theme?: string | null;
  brandColor?: string | null;
  darkBrandColor?: string | null;
  eventTypes: EventType[];
};

type UserProfileClientProps = {
  user: UserProfile;
  salonName: string;
};

export function UserProfileClient({ user, salonName }: UserProfileClientProps) {
  const visibleEventTypes = user.eventTypes?.filter((et) => !et.hidden) || [];
  const brandColor = user.brandColor || "#292929";
  const darkBrandColor = user.darkBrandColor || "#fafafa";

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4"
      style={
        {
          "--brand-color": brandColor,
          "--brand-color-dark": darkBrandColor,
        } as React.CSSProperties
      }
    >
      <div className="max-w-2xl mx-auto">
        {/* User profile header */}
        <div className="text-center mb-8">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={user.salonName || ""}
              width={80}
              height={80}
              className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-brand" />
            </div>
          )}
          <h1
            data-testid="public-profile-name"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            {user.salonName}
          </h1>
          {user.name && user.name !== user.salonName && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">{user.name}</p>
          )}
        </div>

        {/* Event types list */}
        {visibleEventTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Ovaj korisnik nema aktivne tipove termina.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visibleEventTypes.map((eventType) => (
              <Link key={eventType.id} href={`/${salonName}/${eventType.slug}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex items-stretch p-5 min-h-[88px]">
                      {/* Color indicator */}
                      <div className="w-1 rounded-full bg-brand" />

                      {/* Event info */}
                      <div className="flex-1 ml-4 flex flex-col justify-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {eventType.title}
                        </h3>
                        {eventType.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                            {eventType.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {eventType.length < 60
                              ? `${eventType.length} min`
                              : `${eventType.length / 60}h`}
                          </span>
                          {eventType.locations &&
                          (eventType.locations as { address?: string }[])[0]?.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              Uživo
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Pokreće{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Salonko
          </Link>
        </div>
      </div>
    </div>
  );
}

export function UserNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Korisnik nije pronađen</h2>
          <p className="text-gray-500">Ovaj korisnik ne postoji ili nema javne tipove termina.</p>
        </CardContent>
      </Card>
    </div>
  );
}
