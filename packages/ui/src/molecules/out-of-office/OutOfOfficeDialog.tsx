"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@salonko/ui/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui/atoms/Dialog";
import { Label } from "@salonko/ui/atoms/Label";
import { Textarea } from "@salonko/ui/atoms/Textarea";
import { format } from "date-fns";
import { sr } from "date-fns/locale";
import { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Calendar } from "../../atoms/Calendar";
import { formatLocalDateForInput } from "../../lib/utils/formatLocalDateForInput";
import { type Reason, ReasonSelector } from "./ReasonSelector";

const outOfOfficeSchema = z.object({
  startDate: z.string().min(1, "Datum pocetka je obavezan"),
  endDate: z.string().min(1, "Datum zavrsetka je obavezan"),
  reasonId: z.string().optional(),
  notes: z.string().optional(),
});

export type OutOfOfficeFormValues = z.infer<typeof outOfOfficeSchema>;

export type OutOfOfficeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OutOfOfficeFormValues) => void;
  reasons: Reason[];
  isLoading?: boolean;
  editingEntry?: {
    startDate: string;
    endDate: string;
    reasonId?: string;
    notes?: string;
  } | null;
};

export function OutOfOfficeDialog({
  open,
  onOpenChange,
  onSubmit,
  reasons,
  isLoading = false,
  editingEntry,
}: OutOfOfficeDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OutOfOfficeFormValues>({
    resolver: zodResolver(outOfOfficeSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reasonId: undefined,
      notes: "",
    },
  });

  const selectedReasonId = watch("reasonId");
  const notes = watch("notes");

  useEffect(() => {
    if (open && editingEntry) {
      setValue("startDate", editingEntry.startDate);
      setValue("endDate", editingEntry.endDate);
      setValue("reasonId", editingEntry.reasonId);
      setValue("notes", editingEntry.notes || "");
      setDateRange({
        from: new Date(editingEntry.startDate),
        to: new Date(editingEntry.endDate),
      });
    } else if (!open) {
      reset();
      setDateRange(undefined);
    }
  }, [open, editingEntry, setValue, reset]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from) {
      setValue("startDate", formatLocalDateForInput(range.from));
    } else {
      setValue("startDate", "");
    }
    if (range?.to) {
      setValue("endDate", formatLocalDateForInput(range.to));
    } else {
      setValue("endDate", "");
    }
  };

  const handleClose = () => {
    reset();
    setDateRange(undefined);
    onOpenChange(false);
  };

  const handleFormSubmit = (data: OutOfOfficeFormValues) => {
    onSubmit(data);
  };

  const isEditing = !!editingEntry;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const hasValidDateRange = dateRange?.from && dateRange?.to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Izmeni period odsustva" : "Dodaj period odsustva"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="flex justify-center">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              disabled={{ before: today }}
              weekStartsOn={1}
              locale={sr}
              numberOfMonths={1}
              className="rounded-md border"
            />
          </div>

          {dateRange?.from && (
            <p className="text-sm text-center text-muted-foreground">
              {dateRange.to ? (
                <>
                  {format(dateRange.from, "d. MMM yyyy.", { locale: sr })} -{" "}
                  {format(dateRange.to, "d. MMM yyyy.", { locale: sr })}
                </>
              ) : (
                <>Izaberite krajnji datum</>
              )}
            </p>
          )}

          {(errors.startDate || errors.endDate) && !hasValidDateRange && (
            <p className="text-sm text-center text-destructive">Izaberite period odsustva</p>
          )}

          {reasons.length > 0 && (
            <div className="space-y-2">
              <Label>Razlog (opciono)</Label>
              <ReasonSelector
                reasons={reasons}
                selectedReasonId={selectedReasonId}
                onSelect={(id) => setValue("reasonId", id)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Napomena (opciono)</Label>
            <Textarea
              id="notes"
              value={notes || ""}
              onChange={(e) => setValue("notes", e.target.value)}
              rows={2}
              placeholder="Dodatne informacije..."
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Otkazi
            </Button>
            <Button type="submit" disabled={isLoading || !hasValidDateRange}>
              {isLoading ? "Cuvanje..." : isEditing ? "Sacuvaj izmene" : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
