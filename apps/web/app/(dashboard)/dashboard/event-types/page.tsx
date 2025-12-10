"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent } from "@zakazi-termin/ui";
import { Plus, Clock, MapPin, Eye, EyeOff, MoreVertical, Trash2, Copy, ExternalLink, Pencil } from "lucide-react";

export default function EventTypesPage() {
  const [copySuccess, setCopySuccess] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: eventTypes, isLoading } = trpc.eventType.list.useQuery();
  const { data: currentUser } = trpc.user.me.useQuery();

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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${baseUrl}/${currentUser?.username}/${eventType.slug}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(eventTypes?.findIndex(e => e.slug === eventType.slug) ?? null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tipovi termina</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kreirajte i upravljajte vrstama termina koje nudite
          </p>
        </div>
        <Link href="/dashboard/event-types/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novi tip termina
          </Button>
        </Link>
      </div>

      {eventTypes?.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nemate tipove termina
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Kreirajte svoj prvi tip termina da biste omogućili klijentima da zakazuju.
              </p>
              <Link href="/dashboard/event-types/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Kreiraj tip termina
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {eventTypes?.map((eventType, index) => (
            <Card
              key={eventType.id}
              className={`transition-opacity ${eventType.hidden ? "opacity-60" : ""}`}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-4">
                  {/* Left section - Event info */}
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: eventType.hidden ? "#9CA3AF" : "#3B82F6" }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(eventType.length)}
                        </span>
                        {eventType.locations && Array.isArray(eventType.locations) && eventType.locations.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {(eventType.locations as { type: string; address?: string }[])[0]?.address || "Lokacija"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right section - Actions */}
                  <div className="flex items-center gap-2">
                    {/* Copy link button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(eventType)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {copySuccess === index ? (
                        <span className="text-green-600 text-xs">Kopirano!</span>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline text-xs">Kopiraj link</span>
                        </>
                      )}
                    </Button>

                    {/* Preview link */}
                    <Link
                      href={`/${currentUser?.username}/${eventType.slug}`}
                      target="_blank"
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
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
                      <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(eventType.id)}
                      className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Public URL bar */}
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                  <code className="text-xs text-gray-600 dark:text-gray-400">
                    {process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/{currentUser?.username}/{eventType.slug}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help section */}
      {eventTypes && eventTypes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Kako funkcioniše?</h4>
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Podelite link za zakazivanje sa klijentima. Oni mogu izabrati slobodan termin
            iz vaše dostupnosti, a vi ćete dobiti obaveštenje o novom terminu.
          </p>
        </div>
      )}
    </div>
  );
}
