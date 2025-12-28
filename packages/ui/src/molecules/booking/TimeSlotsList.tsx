"use client";

import { Button } from "@salonko/ui";
import {
  confirmButtonAnimation,
  fadeInLeft,
  staggerContainer,
  staggerItem,
} from "@salonko/ui/organisms/booking-flow/animation-config";
import { AnimatePresence, m } from "framer-motion";

interface TimeSlotsListProps {
  selectedDate: Date | null;
  slots: string[];
  tentativeSlot: string | null;
  selectedSlot: string | null;
  bookingState: string;
  onSlotSelect: (slot: string) => void;
  onConfirmSlot: () => void;
}

export function TimeSlotsList({
  selectedDate,
  slots,
  tentativeSlot,
  selectedSlot,
  bookingState,
  onSlotSelect,
  onConfirmSlot,
}: TimeSlotsListProps) {
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
    <AnimatePresence>
      {(bookingState === "selecting_time" || bookingState === "booking") && (
        <m.div
          variants={fadeInLeft}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="px-5 py-6 md:px-6 md:py-8 w-full md:w-[280px] lg:w-[320px]"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {selectedDate ? formatDate(selectedDate) : "Izaberite datum"}
          </h3>

          {selectedDate ? (
            <m.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="overflow-y-auto space-y-3 max-h-96 pr-1"
            >
              {slots.length > 0 ? (
                slots.map((slot) => {
                  const isSelected = tentativeSlot === slot;
                  const isConfirmed = selectedSlot === slot;

                  return (
                    <m.button
                      key={slot}
                      type="button"
                      onClick={() => onSlotSelect(slot)}
                      variants={staggerItem}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                        isConfirmed
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : isSelected
                            ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/50"
                            : "border-border hover:border-primary/50 hover:bg-secondary dark:text-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{formatTime(slot)}</span>
                        {isSelected && !isConfirmed && (
                          <m.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs px-2 py-1 bg-primary/20 rounded-full"
                          >
                            Izabrano
                          </m.span>
                        )}
                      </div>
                    </m.button>
                  );
                })
              ) : (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">
                  Nema dostupnih termina za ovaj dan
                </p>
              )}
            </m.div>
          ) : (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              Izaberite datum sa kalendara da vidite dostupne termine
            </p>
          )}

          {/* Confirmation button */}
          <AnimatePresence>
            {tentativeSlot && !selectedSlot && (
              <m.div
                variants={confirmButtonAnimation}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="overflow-hidden"
              >
                <Button className="w-full shadow-lg" onClick={onConfirmSlot}>
                  Potvrdi i nastavi
                </Button>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      )}
    </AnimatePresence>
  );
}
