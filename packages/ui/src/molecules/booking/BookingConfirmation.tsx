import { Card, CardContent } from "@salonko/ui";
import { Calendar, CalendarPlus, CheckCircle, Clock, Download, MapPin } from "lucide-react";
import Link from "next/link";

interface CalendarLink {
  id: string;
  label: string;
  link: string;
}

interface BookingConfirmationProps {
  bookingUid: string | null;
  eventTitle: string;
  eventLength: number;
  eventLocation?: string;
  selectedSlot: string | null;
  isRescheduling: boolean;
  requiresConfirmation: boolean;
  calendarLinks: CalendarLink[];
}

export function BookingConfirmation({
  bookingUid,
  eventTitle,
  eventLength,
  eventLocation,
  selectedSlot,
  isRescheduling,
  requiresConfirmation,
  calendarLinks,
}: BookingConfirmationProps) {
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("sr-RS", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="flex justify-center items-center px-4 py-12 min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg">
        <CardContent className="py-12 text-center">
          <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full dark:bg-green-900">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isRescheduling
              ? "Termin je promenjen!"
              : requiresConfirmation
                ? "Zahtev je poslat!"
                : "Termin je zakazan!"}
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {isRescheduling
              ? "Uspešno ste promenili termin. Detalje ćete dobiti na email."
              : requiresConfirmation
                ? "Vaš zahtev za termin je poslat. Dobićete obaveštenje kada bude potvrđen."
                : "Uspešno ste zakazali termin. Detalje ćete dobiti na email."}
          </p>

          <div className="p-4 mb-6 text-left bg-gray-50 rounded-lg dark:bg-gray-800">
            <h3 className="mb-3 font-medium text-gray-900 dark:text-gray-100">{eventTitle}</h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex gap-2 items-center">
                <Calendar className="w-4 h-4" />
                <span>{selectedSlot && formatDate(new Date(selectedSlot))}</span>
              </div>
              <div className="flex gap-2 items-center">
                <Clock className="w-4 h-4" />
                <span>
                  {selectedSlot && formatTime(selectedSlot)} ({eventLength} min)
                </span>
              </div>
              {eventLocation && (
                <div className="flex gap-2 items-center">
                  <MapPin className="w-4 h-4" />
                  <span>{eventLocation}</span>
                </div>
              )}
            </div>
          </div>

          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Referentni kod:{" "}
            <code className="px-2 py-1 bg-gray-100 rounded dark:bg-gray-800">
              {bookingUid?.slice(0, 8).toUpperCase()}
            </code>
          </p>

          {/* Add to Calendar */}
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Dodaj u kalendar:
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {calendarLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={link.id === "ics" ? `${eventTitle}.ics` : undefined}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-colors hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {link.id === "ics" ? (
                    <Download className="w-4 h-4" />
                  ) : (
                    <CalendarPlus className="w-4 h-4" />
                  )}
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <Link
            href={`/booking/${bookingUid}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Pogledaj detalje termina
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
