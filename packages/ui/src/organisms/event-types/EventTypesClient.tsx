"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent } from "@salonko/ui";
import { Clock, Copy, ExternalLink, Eye, EyeOff, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EventType = RouterOutputs["eventType"]["list"][number];
type User = Pick<NonNullable<RouterOutputs["user"]["me"]>, "id" | "username" | "name">;

type EventTypesClientProps = {
  initialEventTypes: EventType[];
  currentUser: User | null;
};

export function EventTypesClient({ initialEventTypes, currentUser }: EventTypesClientProps) {
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: eventTypes } = trpc.eventType.list.useQuery(undefined, {
    initialData: initialEventTypes,
  });

  const deleteEventType = trpc.eventType.delete.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
    },
  });

  const toggleHidden = trpc.eventType.update.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
    },
  });

  const handleCopyLink = async (eventType: { slug: string }) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const link = `${baseUrl}/${currentUser?.username}/${eventType.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(
        eventTypes?.findIndex((e: { slug: string }) => e.slug === eventType.slug) ?? null
      );
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Da li ste sigurni da želite da obrišete ovaj tip termina?")) {
      deleteEventType.mutate({ id });
    }
  };

  const handleToggleVisibility = (id: number, currentHidden: boolean) => {
    toggleHidden.mutate({ id, hidden: !currentHidden });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipovi termina</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Kreirajte i upravljajte vrstama termina koje nudite
          </p>
        </div>
        <Link href="/dashboard/event-types/new">
          <Button>
            <Plus className="mr-2 w-4 h-4" />
            Novi tip termina
          </Button>
        </Link>
      </div>

      {eventTypes?.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Nemate tipove termina
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                Kreirajte svoj prvi tip termina da biste omogućili klijentima da zakazuju.
              </p>
              <Link href="/dashboard/event-types/new">
                <Button>
                  <Plus className="mr-2 w-4 h-4" />
                  Kreiraj tip termina
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventTypes?.map((eventType: EventType, index: number) => (
            <Card
              key={eventType.id}
              className={`transition-opacity ${eventType.hidden ? "opacity-60" : ""}`}
            >
              <CardContent className="p-0">
                <div className="flex justify-between items-center p-4">
                  {/* Left section - Event info */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{
                        backgroundColor: eventType.hidden ? "#9CA3AF" : "#3B82F6",
                      }}
                    />
                    <div>
                      <div className="flex gap-2 items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {eventType.title}
                        </h3>
                        {eventType.hidden && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                            Skriveno
                          </span>
                        )}
                        {eventType.requiresConfirmation && (
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                            Zahteva potvrdu
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex gap-1 items-center">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(eventType.length)}
                        </span>
                        {eventType.locations &&
                        Array.isArray(eventType.locations) &&
                        eventType.locations.length > 0 ? (
                          <span className="flex gap-1 items-center">
                            <MapPin className="w-3.5 h-3.5" />
                            {(
                              eventType.locations as {
                                type: string;
                                address?: string;
                              }[]
                            )[0]?.address || "Lokacija"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right section - Actions */}
                  <div className="flex gap-2 items-center">
                    {/* Copy link button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(eventType)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {copySuccess === index ? (
                        <span className="text-xs text-green-600">Kopirano!</span>
                      ) : (
                        <>
                          <Copy className="mr-1 w-4 h-4" />
                          <span className="hidden text-xs sm:inline">Kopiraj link</span>
                        </>
                      )}
                    </Button>

                    {/* Preview link */}
                    <Link
                      href={`/${currentUser?.username}/${eventType.slug}`}
                      target="_blank"
                      className="p-2 text-gray-500 rounded-md dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    {/* Toggle visibility */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVisibility(eventType.id, eventType.hidden)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {eventType.hidden ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>

                    {/* Edit */}
                    <Link href={`/dashboard/event-types/${eventType.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(eventType.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      data-testid={`delete-event-type-${eventType.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Public URL bar */}
                <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 dark:bg-gray-800/50">
                  <code className="text-xs text-gray-600 dark:text-gray-400">
                    {baseUrl}/{currentUser?.username}/{eventType.slug}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help section */}
      {eventTypes && eventTypes.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
          <h4 className="mb-1 font-medium text-blue-900 dark:text-blue-300">Kako funkcioniše?</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Podelite link za zakazivanje sa klijentima. Oni mogu izabrati slobodan termin iz vaše
            dostupnosti, a vi ćete dobiti obaveštenje o novom terminu.
          </p>
        </div>
      )}
    </div>
  );
}
