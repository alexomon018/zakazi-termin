"use client";

import Link from "next/link";
import { Card, CardContent } from "@zakazi-termin/ui";
import { Clock, MapPin, User, ArrowRight } from "lucide-react";

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
  username: string | null;
  avatarUrl: string | null;
  eventTypes: EventType[];
};

type UserProfileClientProps = {
  user: UserProfile;
  username: string;
};

export function UserProfileClient({ user, username }: UserProfileClientProps) {
  const visibleEventTypes = user.eventTypes?.filter((et) => !et.hidden) || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* User profile header */}
        <div className="text-center mb-8">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || ""}
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-blue-600" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
        </div>

        {/* Event types list */}
        {visibleEventTypes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">Ovaj korisnik nema aktivne tipove termina.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visibleEventTypes.map((eventType) => (
              <Link key={eventType.id} href={`/${username}/${eventType.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      {/* Color indicator */}
                      <div
                        className="w-1 h-16 rounded-full mr-4"
                        style={{ backgroundColor: "#3B82F6" }}
                      />

                      {/* Event info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{eventType.title}</h3>
                        {eventType.description && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {eventType.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {eventType.length < 60
                              ? `${eventType.length} min`
                              : `${eventType.length / 60}h`}
                          </span>
                          {eventType.locations &&
                            (eventType.locations as { address?: string }[])[0]?.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                Uživo
                              </span>
                            )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-gray-400" />
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
            Zakazi Termin
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
