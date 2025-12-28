"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@salonko/ui";
import { m } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookingCalendar } from "@salonko/ui/molecules/booking/BookingCalendar";
import { BookingConfirmation } from "@salonko/ui/molecules/booking/BookingConfirmation";
import {
  BookingDetailsForm,
  type BookingDetailsFormData,
} from "@salonko/ui/molecules/booking/BookingDetailsForm";
import { BookingEventHeader } from "@salonko/ui/molecules/booking/BookingEventHeader";
import { RescheduleBanner } from "@salonko/ui/molecules/booking/RescheduleBanner";
import { TimeSlotsList } from "@salonko/ui/molecules/booking/TimeSlotsList";
import { FramerMotionProvider } from "./framer-features";
import { useBookingResizeAnimation } from "./hooks/useBookingResizeAnimation";
import { useBookingStore } from "./store";
import { getCalendarLinks } from "./utils/getCalendarLinks";

type BookingStep = "select-time" | "enter-details" | "confirmation";

type EventType = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  length: number;
  requiresConfirmation: boolean;
  locations: unknown;
  user: {
    id: number;
    name: string | null;
    avatarUrl: string | null;
  } | null;
};

type BookingFlowProps = {
  eventType: EventType;
  username: string;
  eventSlug: string;
};

export function BookingFlow({ eventType, username, eventSlug }: BookingFlowProps) {
  const searchParams = useSearchParams();
  const rescheduleUid = searchParams.get("rescheduleUid");

  // Zustand store
  const {
    state: bookingState,
    selectedDate: selectedDateStr,
    selectedSlot,
    tentativeSlot,
    currentMonth,
    formData,
    setSelectedDate: setSelectedDateStore,
    setTentativeSlot,
    confirmSlot,
    setCurrentMonth,
    setFormData,
    setState,
    reset: resetStore,
  } = useBookingStore();

  // Local state for compatibility
  const [currentStep, setCurrentStep] = useState<BookingStep>("select-time");
  const selectedDate = selectedDateStr ? new Date(selectedDateStr) : null;
  const [bookingUid, setBookingUid] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [monthDirection, setMonthDirection] = useState<"next" | "prev">("next");

  // Resize animation
  const containerScope = useBookingResizeAnimation({
    state: bookingState,
    isMobile: false,
  });

  // Fetch existing booking if rescheduling
  const { data: existingBooking, isLoading: existingBookingLoading } = trpc.booking.byUid.useQuery(
    { uid: rescheduleUid! },
    { enabled: !!rescheduleUid }
  );

  // Pre-fill form data from existing booking
  useEffect(() => {
    if (existingBooking?.attendees[0]) {
      const attendee = existingBooking.attendees[0];
      setFormData({
        name: attendee.name,
        email: attendee.email,
        phoneNumber: attendee.phoneNumber || "",
        notes: existingBooking.description || "",
      });
    }
  }, [existingBooking, setFormData]);

  // Calculate date range for slots query
  const dateRange = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  }, [currentMonth]);

  // Fetch available slots
  const { data: slotsData, isLoading: slotsLoading } = trpc.availability.getSlots.useQuery(
    {
      eventTypeId: eventType.id,
      dateFrom: dateRange.start,
      dateTo: dateRange.end,
    },
    {
      enabled: !!eventType.id,
    }
  );

  // Create booking mutation
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (booking: { uid: string }) => {
      setBookingUid(booking.uid);
      setCurrentStep("confirmation");
    },
    onError: (error: { message: string }) => {
      if (error.message.includes("nije dostupan")) {
        setServerError("Izabrani termin više nije dostupan. Molimo izaberite drugi.");
        setTentativeSlot(null);
        setCurrentStep("select-time");
      } else {
        setServerError(error.message);
      }
    },
  });

  // Reschedule mutation
  const rescheduleBooking = trpc.booking.reschedule.useMutation({
    onSuccess: (booking: { uid: string }) => {
      setBookingUid(booking.uid);
      setCurrentStep("confirmation");
    },
    onError: (error: { message: string }) => {
      if (error.message.includes("nije dostupan")) {
        setServerError("Izabrani termin nije dostupan. Molimo izaberite drugi.");
        setTentativeSlot(null);
        setCurrentStep("select-time");
      } else {
        setServerError(error.message);
      }
    },
  });

  // Group slots by date
  const slotsByDate = useMemo(() => {
    if (!slotsData?.slots) return {};
    const grouped: Record<string, string[]> = {};
    for (const slot of slotsData.slots) {
      const date = new Date(slot.time).toDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(slot.time);
    }
    return grouped;
  }, [slotsData]);

  const handleDateSelect = (date: Date) => {
    // setSelectedDateStore already handles:
    // 1. Setting selectedDate
    // 2. Setting state to 'selecting_time'
    // 3. Clearing selectedSlot and tentativeSlot
    setSelectedDateStore(date.toISOString());
  };

  const handleSlotSelect = (slot: string) => {
    setTentativeSlot(slot);
  };

  const handleConfirmSlot = () => {
    confirmSlot();
    setCurrentStep("enter-details");
  };

  const handleBack = () => {
    if (currentStep === "enter-details") {
      setCurrentStep("select-time");
      setTentativeSlot(null);
      setState("selecting_time");
    }
  };

  const handleSubmit = (data: BookingDetailsFormData) => {
    setServerError(null);

    if (!eventType || !selectedSlot) return;

    const startTime = new Date(selectedSlot);
    const endTime = new Date(startTime.getTime() + eventType.length * 60 * 1000);

    // If rescheduling, use reschedule mutation
    if (rescheduleUid) {
      rescheduleBooking.mutate({
        uid: rescheduleUid,
        newStartTime: startTime,
        newEndTime: endTime,
      });
    } else {
      // Create new booking
      createBooking.mutate({
        eventTypeId: eventType.id,
        startTime,
        endTime,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        notes: data.notes || undefined,
      });
    }
  };

  const goToPreviousMonth = () => {
    setMonthDirection("prev");
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDateStore(null);
  };

  const goToNextMonth = () => {
    setMonthDirection("next");
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDateStore(null);
  };

  const isLoading = rescheduleUid && existingBookingLoading;
  const isPending = createBooking.isPending || rescheduleBooking.isPending;
  const isRescheduling = !!rescheduleUid;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Učitavanje...</div>
      </div>
    );
  }

  // Generate calendar links
  const calendarLinks = selectedSlot
    ? getCalendarLinks({
        startTime: new Date(selectedSlot),
        endTime: new Date(new Date(selectedSlot).getTime() + eventType.length * 60 * 1000),
        title: eventType.title,
        description: eventType.description,
        location: (eventType.locations as { address?: string }[])?.[0]?.address,
      })
    : [];

  // Confirmation step
  if (currentStep === "confirmation") {
    return (
      <BookingConfirmation
        bookingUid={bookingUid}
        eventTitle={eventType.title}
        eventLength={eventType.length}
        eventLocation={(eventType.locations as { address?: string }[])?.[0]?.address}
        selectedSlot={selectedSlot}
        isRescheduling={isRescheduling}
        requiresConfirmation={eventType.requiresConfirmation}
        calendarLinks={calendarLinks}
      />
    );
  }

  return (
    <FramerMotionProvider>
      <div className="px-2 sm:px-4 py-8 min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-6xl">
          {/* Reschedule banner */}
          {isRescheduling && existingBooking && (
            <RescheduleBanner currentStartTime={existingBooking.startTime} />
          )}

          {/* Header */}
          <BookingEventHeader
            eventTitle={eventType.title}
            eventDescription={eventType.description}
            eventLength={eventType.length}
            eventLocation={(eventType.locations as { address?: string }[])?.[0]?.address}
            userName={eventType.user?.name}
            userAvatarUrl={eventType.user?.avatarUrl}
            isRescheduling={isRescheduling}
          />

          {/* Booking flow */}
          <m.div
            ref={containerScope}
            className="booking-container mx-auto"
            data-state={bookingState}
          >
            <Card className="overflow-hidden w-full sm:w-fit mx-auto">
              <CardContent className="p-0">
                {currentStep === "select-time" ? (
                  <div className="flex flex-col md:flex-row divide-y divide-gray-200 dark:divide-gray-700 md:divide-y-0 md:divide-x">
                    {/* Calendar */}
                    <BookingCalendar
                      currentMonth={currentMonth}
                      selectedDate={selectedDate}
                      slotsByDate={slotsByDate}
                      slotsLoading={slotsLoading}
                      onDateSelect={handleDateSelect}
                      onPreviousMonth={goToPreviousMonth}
                      onNextMonth={goToNextMonth}
                      monthDirection={monthDirection}
                    />

                    {/* Time slots */}
                    <TimeSlotsList
                      key={selectedDate?.toISOString() || "no-date"}
                      selectedDate={selectedDate}
                      slots={selectedDate ? slotsByDate[selectedDate.toDateString()] || [] : []}
                      tentativeSlot={tentativeSlot}
                      selectedSlot={selectedSlot}
                      bookingState={bookingState}
                      onSlotSelect={handleSlotSelect}
                      onConfirmSlot={handleConfirmSlot}
                    />
                  </div>
                ) : (
                  /* Enter details form */
                  <BookingDetailsForm
                    selectedSlot={selectedSlot}
                    eventLength={eventType.length}
                    defaultValues={formData}
                    serverError={serverError}
                    isPending={isPending}
                    isRescheduling={isRescheduling}
                    onSubmit={handleSubmit}
                    onBack={handleBack}
                  />
                )}
              </CardContent>
            </Card>
          </m.div>

          {/* Footer */}
          <div className="mt-8 text-sm text-center text-gray-500 dark:text-gray-400">
            Pokreće{" "}
            <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
              Salonko
            </Link>
          </div>
        </div>
      </div>
    </FramerMotionProvider>
  );
}

export function EventNotFound() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Card className="mx-auto max-w-md">
        <CardContent className="py-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
            Stranica nije pronađena
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Ovaj tip termina ne postoji ili nije dostupan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
