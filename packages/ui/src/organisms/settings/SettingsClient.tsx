"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import {
  AlertCircle,
  Calendar,
  Check,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Connection = RouterOutputs["calendar"]["listConnections"][number];

type SettingsClientProps = {
  initialConnections: Connection[];
};

export function SettingsClient({ initialConnections }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");

  const [connectingCalendar, setConnectingCalendar] = useState(false);

  const utils = trpc.useUtils();

  const { data: connections } = trpc.calendar.listConnections.useQuery(
    undefined,
    {
      initialData: initialConnections,
    }
  );

  const disconnectCalendar = trpc.calendar.disconnect.useMutation({
    onSuccess: () => {
      utils.calendar.listConnections.invalidate();
    },
  });

  const handleConnectGoogle = async () => {
    setConnectingCalendar(true);
    try {
      const response = await fetch(
        `/api/integrations/google-calendar/add?returnTo=${encodeURIComponent("/dashboard/settings")}`
      );
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to initiate Google Calendar connection:", error);
      setConnectingCalendar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Podešavanja
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Upravljajte svojim nalogom i integracijama
        </p>
      </div>

      {/* Success/Error Messages */}
      {successParam === "google_calendar_connected" && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">
            Google Calendar je uspešno povezan!
          </span>
        </div>
      )}

      {errorParam && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">
            {errorParam === "google_auth_denied" &&
              "Odbili ste pristup Google Calendar-u."}
            {errorParam === "google_auth_failed" &&
              "Greška pri povezivanju sa Google Calendar-om."}
            {errorParam === "google_not_configured" &&
              "Google Calendar integracija nije podešena."}
            {errorParam === "missing_code" && "Nedostaje autorizacioni kod."}
          </span>
        </div>
      )}

      {/* Calendar Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center text-lg">
            <Calendar className="w-5 h-5" />
            Kalendar integracije
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Povežite svoje kalendare kako bismo automatski proveravali vašu
            zauzetost i izbegavali duple rezervacije.
          </p>

          {/* Connected Calendars */}
          <div className="space-y-3">
            {connections && connections.length > 0 ? (
              connections.map((connection: Connection) => (
                <div
                  key={connection.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex justify-center items-center w-10 h-10 bg-white rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        role="img"
                        aria-label="Google Calendar logo"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Google Calendar
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {connection.calendarsCount} kalendar(a) odabrano
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <CalendarSelectionButton credentialId={connection.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "Da li ste sigurni da želite da isključite ovaj kalendar?"
                          )
                        ) {
                          disconnectCalendar.mutate({
                            credentialId: connection.id,
                          });
                        }
                      }}
                      disabled={disconnectCalendar.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-2 text-sm text-gray-500 dark:text-gray-400">
                Nemate povezanih kalendara.
              </p>
            )}
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnectGoogle}
            disabled={connectingCalendar}
            className="w-full"
          >
            <svg
              className="mr-2 w-5 h-5"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Google logo"
            >
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {connectingCalendar ? "Povezivanje..." : "Poveži Google Calendar"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarSelectionButton({ credentialId }: { credentialId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: calendars, isLoading } = trpc.calendar.listCalendars.useQuery(
    { credentialId },
    { enabled: isOpen }
  );

  const toggleSelection = trpc.calendar.toggleCalendarSelection.useMutation({
    onSuccess: () => {
      utils.calendar.listCalendars.invalidate({ credentialId });
      utils.calendar.listConnections.invalidate();
    },
  });

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <ExternalLink className="mr-1 w-4 h-4" />
        Kalendari
      </Button>
    );
  }

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50">
      <div className="mx-4 w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Odaberite kalendare
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Odabrani kalendari će se koristiti za proveru zauzetosti
          </p>
        </div>
        <div className="overflow-y-auto p-4 max-h-80">
          {isLoading ? (
            <div className="py-4 text-center text-gray-500 dark:text-gray-400">
              Učitavanje...
            </div>
          ) : (
            <div className="space-y-2">
              {calendars?.map(
                (cal: {
                  externalId: string;
                  selected: boolean;
                  name: string;
                  primary: boolean;
                }) => (
                  <label
                    key={cal.externalId}
                    className="flex gap-3 items-center p-2 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={cal.selected}
                      onChange={() =>
                        toggleSelection.mutate({
                          credentialId,
                          externalId: cal.externalId,
                          selected: !cal.selected,
                        })
                      }
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {cal.name}
                      </p>
                      {cal.primary && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Primarni
                        </span>
                      )}
                    </div>
                  </label>
                )
              )}
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={() => setIsOpen(false)} className="w-full">
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
