"use client";

import * as React from "react";
import { Button, Input, Label } from "@zakazi-termin/ui";
import {
  Clock,
  Calendar,
  ChevronLeft,
  User,
  Mail,
  Phone,
  FileText,
} from "lucide-react";

interface BookingDetailsFormProps {
  selectedSlot: string | null;
  eventLength: number;
  formData: {
    name: string;
    email: string;
    phoneNumber: string;
    notes: string;
  };
  errors: Record<string, string>;
  isPending: boolean;
  isRescheduling: boolean;
  onFormDataChange: (data: Partial<BookingDetailsFormProps["formData"]>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export function BookingDetailsForm({
  selectedSlot,
  eventLength,
  formData,
  errors,
  isPending,
  isRescheduling,
  onFormDataChange,
  onSubmit,
  onBack,
}: BookingDetailsFormProps) {
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
    <div className="p-6 w-full md:w-[420px] lg:w-[480px]">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center mb-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <ChevronLeft className="mr-1 w-4 h-4" />
        Nazad na izbor termina
      </button>

      {/* Selected time summary */}
      <div className="p-4 mb-6 bg-gray-50 rounded-lg dark:bg-gray-800">
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

      {errors.form && (
        <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-lg dark:text-red-400 dark:bg-red-900/30">
          {errors.form}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex gap-2 items-center">
            <User className="w-4 h-4" />
            Ime i prezime *
          </Label>
          <Input
            id="name"
            placeholder="Vaše ime"
            value={formData.name}
            onChange={(e) => onFormDataChange({ name: e.target.value })}
            className={errors.name ? "border-red-500" : ""}
            disabled={isRescheduling}
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
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
            onChange={(e) => onFormDataChange({ email: e.target.value })}
            className={errors.email ? "border-red-500" : ""}
            disabled={isRescheduling}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </div>

        {!isRescheduling && (
          <>
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
                onChange={(e) => onFormDataChange({ phoneNumber: e.target.value })}
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
                onChange={(e) => onFormDataChange({ notes: e.target.value })}
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
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
