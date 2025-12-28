"use client";

import { Button } from "@salonko/ui";
import {
  createMonthTransition,
  scaleOnHover,
} from "@salonko/ui/organisms/booking-flow/animation-config";
import { AnimatePresence, m } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";

interface BookingCalendarProps {
  currentMonth: Date;
  selectedDate: Date | null;
  slotsByDate: Record<string, string[]>;
  slotsLoading?: boolean;
  onDateSelect: (date: Date) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  monthDirection?: "next" | "prev";
}

export function BookingCalendar({
  currentMonth,
  selectedDate,
  slotsByDate,
  slotsLoading,
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
  monthDirection = "next",
}: BookingCalendarProps) {
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

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const hasAvailableSlots = (date: Date) => {
    return !!slotsByDate[date.toDateString()]?.length;
  };

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-8 w-full md:w-[420px] lg:w-[480px]">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
          {currentMonth.toLocaleDateString("sr-RS", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreviousMonth}
            disabled={currentMonth <= new Date()}
            className="p-0 w-8 h-8 sm:w-9 sm:h-9"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNextMonth}
            className="p-0 w-8 h-8 sm:w-9 sm:h-9"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3">
        {["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"].map((day) => (
          <div
            key={day}
            className="py-1 sm:py-2 text-xs sm:text-sm font-medium text-center text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <m.div
          key={currentMonth.toISOString()}
          variants={createMonthTransition(monthDirection)}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="grid grid-cols-7 gap-1 sm:gap-2"
        >
          {calendarDays.map((date, index) => {
            if (!date) {
              return (
                <div key={`empty-${currentMonth.getMonth()}-${index}`} className="p-1 sm:p-2" />
              );
            }

            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const isPast = isPastDate(date);
            const hasSlots = hasAvailableSlots(date);
            const isDisabled = isPast || !hasSlots;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <m.button
                key={date.toISOString()}
                type="button"
                disabled={isDisabled}
                onClick={() => onDateSelect(date)}
                variants={scaleOnHover}
                initial="rest"
                whileHover={!isDisabled ? "hover" : "rest"}
                whileTap={!isDisabled ? "tap" : "rest"}
                className={`relative p-1.5 sm:p-2 md:p-3 text-sm sm:text-base rounded-lg transition-all min-h-[36px] sm:min-h-[44px] md:min-h-[56px] font-medium flex items-center justify-center ${
                  isSelected
                    ? "bg-brand text-white dark:text-gray-900 shadow-md ring-2 ring-brand ring-offset-1 sm:ring-offset-2"
                    : isDisabled
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-foreground bg-secondary/50 hover:bg-brand/10 hover:shadow-sm"
                } ${hasSlots && !isPast ? "font-semibold" : ""} ${
                  isToday && !isSelected ? "ring-2 ring-brand ring-offset-0" : ""
                }`}
              >
                {date.getDate()}
              </m.button>
            );
          })}
        </m.div>
      </AnimatePresence>

      {slotsLoading && (
        <p className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
          Učitavanje termina...
        </p>
      )}
    </div>
  );
}
