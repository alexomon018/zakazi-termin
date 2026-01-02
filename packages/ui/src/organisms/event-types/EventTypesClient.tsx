"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent, cn } from "@salonko/ui";
import { Clock, Copy, ExternalLink, Eye, EyeOff, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EventType = RouterOutputs["eventType"]["list"][number];
type User = Pick<NonNullable<RouterOutputs["user"]["me"]>, "id" | "salonName" | "name">;

type EventTypesClientProps = {
  initialEventTypes: EventType[];
  currentUser: User | null;
};

/**
 * Client component that displays and manages a salon's event types.
 *
 * Renders a list of event type cards (or an empty state) with controls to copy the public link,
 * preview, toggle visibility, edit, and delete each event type. Copying writes the public URL to
 * the clipboard; deleting and toggling visibility perform mutations and invalidate the event type
 * list query to refresh data.
 *
 * @param initialEventTypes - Initial array of event types used as the query's initial data.
 * @param currentUser - Current user info (includes `id`, `salonName`, `name`) or `null`; used to
 *   construct public URLs and links.
 * @returns The rendered event types management UI element.
 */
export function EventTypesClient({ initialEventTypes, currentUser }: EventTypesClientProps) {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
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

  const handleCopyLink = async (eventType: { id: string; slug: string }) => {
    // Use window.location.origin for client-side (always correct)
    // Fall back to NEXT_PUBLIC_APP_URL for SSR
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";
    const link = `${baseUrl}/${currentUser?.salonName}/${eventType.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(eventType.id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Da li ste sigurni da želite da obrišete ovaj tip termina?")) {
      deleteEventType.mutate({ id });
    }
  };

  const handleToggleVisibility = (id: string, currentHidden: boolean) => {
    toggleHidden.mutate({ id, hidden: !currentHidden });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // Use window.location.origin for client-side (always correct)
  // Fall back to NEXT_PUBLIC_APP_URL for SSR
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipovi termina</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Kreirajte i upravljajte vrstama termina koje nudite
          </p>
        </div>
        <Link href="/dashboard/event-types/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
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
                <div className="p-4">
                  {/* Mobile: Stack layout, Desktop: Row layout */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                    {/* Left section - Event info */}
                    <div className="flex items-center space-x-4 min-w-0">
                      <div
                        className={cn(
                          "w-1 h-12 rounded-full flex-shrink-0",
                          eventType.hidden ? "bg-gray-400" : "bg-blue-500"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2 items-center">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {eventType.title}
                          </h3>
                          {eventType.hidden && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded flex-shrink-0">
                              Skriveno
                            </span>
                          )}
                          {eventType.requiresConfirmation && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded flex-shrink-0">
                              Zahteva potvrdu
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex gap-1 items-center">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                            {formatDuration(eventType.length)}
                          </span>
                          {eventType.locations &&
                          Array.isArray(eventType.locations) &&
                          eventType.locations.length > 0 ? (
                            <span className="flex gap-1 items-center min-w-0">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {(
                                  eventType.locations as {
                                    type: string;
                                    address?: string;
                                  }[]
                                )[0]?.address || "Lokacija"}
                              </span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex gap-1 items-center flex-shrink-0 ml-5 sm:ml-0">
                      {/* Copy link button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(eventType)}
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                      >
                        {copySuccess === eventType.id ? (
                          <span className="text-xs text-green-600">Kopirano!</span>
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>

                      {/* Preview link */}
                      <Link
                        href={`/${currentUser?.salonName}/${eventType.slug}`}
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
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2"
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
                          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(eventType.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 px-2"
                        data-testid={`delete-event-type-${eventType.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Public URL bar */}
                <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-100 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
                  <code className="text-xs text-gray-600 dark:text-gray-400 block truncate">
                    {baseUrl}/{currentUser?.salonName}/{eventType.slug}
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