"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from "@salonko/ui";
import { format } from "date-fns";
import { sr } from "date-fns/locale";
import { useState } from "react";
import { Calendar } from "../../atoms/Calendar";
import { cn } from "../../utils";

export interface DateOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (date: Date, startTime: string, endTime: string) => void;
  onBlock: (date: Date) => void;
  existingDates?: Date[];
  className?: string;
}

export function DateOverrideDialog({
  open,
  onOpenChange,
  onSave,
  onBlock,
  existingDates = [],
  className,
}: DateOverrideDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [markAsUnavailable, setMarkAsUnavailable] = useState(false);

  const handleSave = () => {
    if (!selectedDate) return;

    if (markAsUnavailable) {
      onBlock(selectedDate);
    } else {
      onSave(selectedDate, startTime, endTime);
    }

    // Reset state
    setSelectedDate(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setMarkAsUnavailable(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedDate(undefined);
    setStartTime("09:00");
    setEndTime("17:00");
    setMarkAsUnavailable(false);
    onOpenChange(false);
  };

  // Disable dates that already have overrides and past dates
  const disabledDays = [...existingDates, { before: new Date() }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>Dodaj izuzetak</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              weekStartsOn={1}
              locale={sr}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Izabrano: {format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: sr })}
              </p>

              {/* Mark as unavailable toggle */}
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="unavailable" className="text-sm font-medium">
                  Označi kao nedostupan
                </Label>
                <Switch
                  id="unavailable"
                  checked={markAsUnavailable}
                  onCheckedChange={setMarkAsUnavailable}
                  activeColor="blue"
                />
              </div>

              {/* Time inputs (only if not marked as unavailable) */}
              {!markAsUnavailable && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="start-time" className="text-sm">
                      Od
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="end-time" className="text-sm">
                      Do
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Otkaži
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedDate}>
            Sačuvaj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
