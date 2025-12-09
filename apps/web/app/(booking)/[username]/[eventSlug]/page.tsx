"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { Button, Card, CardContent, Input, Label } from "@zakazi-termin/ui";
import {
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle,
} from "lucide-react";

type BookingStep = "select-time" | "enter-details" | "confirmation";

export default function PublicBookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const eventSlug = params.eventSlug as string;

  const [currentStep, setCurrentStep] = useState<BookingStep>("select-time");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingUid, setBookingUid] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch event type
  const { data: eventType, isLoading: eventTypeLoading } =
    trpc.eventType.getPublic.useQuery({
      username,
      slug: eventSlug,
    });

  // Calculate date range for slots query
  const dateRange = useMemo(() => {
    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    return { start, end };
  }, [currentMonth]);

  console.log("dateRange", dateRange);
  // Fetch available slots
  const { data: slotsData, isLoading: slotsLoading } =
    trpc.availability.getSlots.useQuery(
      {
        eventTypeId: eventType?.id ?? 0,
        dateFrom: dateRange.start,
        dateTo: dateRange.end,
      },
      {
        enabled: !!eventType?.id,
      }
    );

  console.log("slotsData", slotsData);

  // Create booking mutation
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (booking) => {
      setBookingUid(booking.uid);
      setCurrentStep("confirmation");
    },
    onError: (error) => {
      if (error.message.includes("nije dostupan")) {
        setErrors({
          form: "Izabrani termin više nije dostupan. Molimo izaberite drugi.",
        });
        setSelectedSlot(null);
        setCurrentStep("select-time");
      } else {
        setErrors({ form: error.message });
      }
    },
  });

  // Group slots by date
  const slotsByDate = useMemo(() => {
    if (!slotsData?.slots) return {};
    const grouped: Record<string, string[]> = {};
    slotsData.slots.forEach((slot) => {
      const date = new Date(slot.time).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(slot.time);
    });
    return grouped;
  }, [slotsData]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    // Add empty days for alignment (week starts on Monday)
    const startOffset = (firstDay.getDay() + 6) % 7;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add actual days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

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

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      setCurrentStep("enter-details");
    }
  };

  const handleBack = () => {
    if (currentStep === "enter-details") {
      setCurrentStep("select-time");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Ime je obavezno";
    if (!formData.email.trim()) newErrors.email = "Email je obavezan";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Unesite ispravnu email adresu";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!eventType || !selectedSlot) return;

    const startTime = new Date(selectedSlot);
    const endTime = new Date(
      startTime.getTime() + eventType.length * 60 * 1000
    );

    createBooking.mutate({
      eventTypeId: eventType.id,
      startTime,
      endTime,
      name: formData.name,
      email: formData.email,
      phoneNumber: formData.phoneNumber || undefined,
      notes: formData.notes || undefined,
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasAvailableSlots = (date: Date) => {
    return !!slotsByDate[date.toDateString()]?.length;
  };

  if (eventTypeLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Učitavanje...</div>
      </div>
    );
  }

  if (!eventType) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Card className="mx-auto max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Stranica nije pronađena
            </h2>
            <p className="text-gray-500">
              Ovaj tip termina ne postoji ili nije dostupan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation step
  if (currentStep === "confirmation") {
    return (
      <div className="px-4 py-12 min-h-screen bg-gray-50">
        <Card className="mx-auto max-w-lg">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              {eventType.requiresConfirmation
                ? "Zahtev je poslat!"
                : "Termin je zakazan!"}
            </h2>
            <p className="mb-6 text-gray-600">
              {eventType.requiresConfirmation
                ? "Vaš zahtev za termin je poslat. Dobićete obaveštenje kada bude potvrđen."
                : "Uspešno ste zakazali termin. Detalje ćete dobiti na email."}
            </p>

            <div className="p-4 mb-6 text-left bg-gray-50 rounded-lg">
              <h3 className="mb-3 font-medium text-gray-900">
                {eventType.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2 items-center">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {selectedSlot && formatDate(new Date(selectedSlot))}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Clock className="w-4 h-4" />
                  <span>
                    {selectedSlot && formatTime(selectedSlot)} (
                    {eventType.length} min)
                  </span>
                </div>
                {eventType.locations &&
                  (eventType.locations as { address?: string }[])[0]
                    ?.address && (
                    <div className="flex gap-2 items-center">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {
                          (eventType.locations as { address?: string }[])[0]
                            .address
                        }
                      </span>
                    </div>
                  )}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Referentni kod:{" "}
              <code className="px-2 py-1 bg-gray-100 rounded">
                {bookingUid}
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex gap-3 justify-center items-center mb-4">
            {eventType.user?.avatarUrl ? (
              <img
                src={eventType.user.avatarUrl}
                alt={eventType.user.name || ""}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-full">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {eventType.user?.name}
              </h1>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            {eventType.title}
          </h2>
          {eventType.description && (
            <p className="mx-auto max-w-lg text-gray-600">
              {eventType.description}
            </p>
          )}
          <div className="flex gap-4 justify-center items-center mt-4 text-sm text-gray-500">
            <span className="flex gap-1 items-center">
              <Clock className="w-4 h-4" />
              {eventType.length} minuta
            </span>
            {eventType.locations &&
              (eventType.locations as { address?: string }[])[0]?.address && (
                <span className="flex gap-1 items-center">
                  <MapPin className="w-4 h-4" />
                  {(eventType.locations as { address?: string }[])[0].address}
                </span>
              )}
          </div>
        </div>

        {/* Booking flow */}
        <Card>
          <CardContent className="p-0">
            {currentStep === "select-time" ? (
              <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-2 md:divide-y-0 md:divide-x">
                {/* Calendar */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {currentMonth.toLocaleDateString("sr-RS", {
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                        disabled={currentMonth <= new Date()}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Day names */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"].map(
                      (day) => (
                        <div
                          key={day}
                          className="py-2 text-xs font-medium text-center text-gray-500"
                        >
                          {day}
                        </div>
                      )
                    )}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <div key={`empty-${index}`} className="p-2" />;
                      }

                      const isSelected =
                        selectedDate?.toDateString() === date.toDateString();
                      const isPast = isPastDate(date);
                      const hasSlots = hasAvailableSlots(date);
                      const isDisabled = isPast || !hasSlots;

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleDateSelect(date)}
                          className={`p-2 text-sm rounded-lg transition-colors ${
                            isSelected
                              ? "text-white bg-blue-500"
                              : isDisabled
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-900 hover:bg-blue-50"
                          } ${hasSlots && !isPast ? "font-semibold" : ""}`}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {slotsLoading && (
                    <p className="mt-4 text-sm text-center text-gray-500">
                      Učitavanje termina...
                    </p>
                  )}
                </div>

                {/* Time slots */}
                <div className="p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">
                    {selectedDate
                      ? formatDate(selectedDate)
                      : "Izaberite datum"}
                  </h3>

                  {selectedDate ? (
                    <div className="overflow-y-auto space-y-2 max-h-80">
                      {slotsByDate[selectedDate.toDateString()]?.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                            selectedSlot === slot
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      )) || (
                        <p className="py-4 text-center text-gray-500">
                          Nema dostupnih termina za ovaj dan
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="py-12 text-center text-gray-500">
                      Izaberite datum sa kalendara da vidite dostupne termine
                    </p>
                  )}

                  {selectedSlot && (
                    <Button className="mt-4 w-full" onClick={handleContinue}>
                      Nastavi
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              /* Enter details form */
              <div className="p-6 mx-auto max-w-md">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center mb-6 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="mr-1 w-4 h-4" />
                  Nazad na izbor termina
                </button>

                {/* Selected time summary */}
                <div className="p-4 mb-6 bg-gray-50 rounded-lg">
                  <div className="flex gap-2 items-center mb-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {selectedSlot && formatDate(new Date(selectedSlot))}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      {selectedSlot && formatTime(selectedSlot)} (
                      {eventType.length} min)
                    </span>
                  </div>
                </div>

                {errors.form && (
                  <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg">
                    {errors.form}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex gap-2 items-center">
                      <User className="w-4 h-4" />
                      Ime i prezime *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Vaše ime"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex gap-2 items-center">
                      <Mail className="w-4 h-4" />
                      Email adresa *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vas@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex gap-2 items-center">
                      <Phone className="w-4 h-4" />
                      Telefon (opciono)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+381 60 123 4567"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex gap-2 items-center">
                      <FileText className="w-4 h-4" />
                      Napomena (opciono)
                    </Label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Dodatne informacije ili pitanja..."
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending
                      ? "Zakazivanje..."
                      : "Zakaži termin"}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-sm text-center text-gray-500">
          Pokreće{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Zakazi Termin
          </Link>
        </div>
      </div>
    </div>
  );
}
