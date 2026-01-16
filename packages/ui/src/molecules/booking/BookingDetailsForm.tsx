"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Label, PhoneInput } from "@salonko/ui";
import {
  type BookingDetailsFormData,
  bookingDetailsSchema,
} from "@salonko/ui/lib/validations/booking";
import { Calendar, ChevronLeft, Clock, FileText, Mail, Phone, User } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

interface BookingDetailsFormProps {
  selectedSlot: string | null;
  eventLength: number;
  defaultValues?: Partial<BookingDetailsFormData>;
  serverError?: string | null;
  isPending: boolean;
  isRescheduling: boolean;
  onSubmit: (data: BookingDetailsFormData) => void;
  onBack: () => void;
}

export function BookingDetailsForm({
  selectedSlot,
  eventLength,
  defaultValues,
  serverError,
  isPending,
  isRescheduling,
  onSubmit,
  onBack,
}: BookingDetailsFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BookingDetailsFormData>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      phoneNumber: defaultValues?.phoneNumber || "",
      notes: defaultValues?.notes || "",
    },
  });

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
    <div className="p-4 sm:p-5 md:p-6 w-full md:w-[420px] lg:w-[480px]">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center mb-4 sm:mb-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ChevronLeft className="mr-1 w-4 h-4" />
        Nazad na izbor termina
      </button>

      {/* Selected time summary */}
      <div className="p-3 sm:p-4 mb-4 sm:mb-6 bg-gray-50 rounded-lg dark:bg-gray-800">
        <div className="flex gap-2 items-center mb-1 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{selectedSlot && formatDate(new Date(selectedSlot))}</span>
        </div>
        <div className="flex gap-2 items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>
            {selectedSlot && formatTime(selectedSlot)} ({eventLength} min)
          </span>
        </div>
      </div>

      {serverError && (
        <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg dark:text-red-400 dark:bg-red-900/30">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex gap-2 items-center">
            <User className="w-4 h-4" />
            Ime i prezime *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Vaše ime"
            disabled={isRescheduling || isPending}
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex gap-2 items-center">
            <Mail className="w-4 h-4" />
            Email adresa *
          </Label>
          <Input
            id="email"
            type="text"
            placeholder="vas@email.com"
            disabled={isRescheduling || isPending}
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
          )}
        </div>

        {!isRescheduling && (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex gap-2 items-center">
                <Phone className="w-4 h-4" />
                Telefon (opciono)
              </Label>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    id="phoneNumber"
                    defaultCountry="RS"
                    placeholder="60 123 4567"
                    disabled={isPending}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.phoneNumber.message}
                </p>
              )}
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
                disabled={isPending}
                {...register("notes")}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </>
        )}

        <Button type="submit" className="btn-brand w-full" disabled={isPending}>
          {isPending
            ? isRescheduling
              ? "Menjam termin..."
              : "Zakazivanje..."
            : isRescheduling
              ? "Promeni termin"
              : "Zakaži termin"}
        </Button>
      </form>
    </div>
  );
}

export type { BookingDetailsFormData };
