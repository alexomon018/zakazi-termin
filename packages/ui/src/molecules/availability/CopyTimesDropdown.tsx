"use client";

import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salonko/ui";
import { Copy } from "lucide-react";
import { useState } from "react";

const DAYS_OF_WEEK = [
  { value: 1, label: "Ponedeljak", short: "Pon" },
  { value: 2, label: "Utorak", short: "Uto" },
  { value: 3, label: "Sreda", short: "Sre" },
  { value: 4, label: "Četvrtak", short: "Čet" },
  { value: 5, label: "Petak", short: "Pet" },
  { value: 6, label: "Subota", short: "Sub" },
  { value: 0, label: "Nedelja", short: "Ned" },
];

export interface CopyTimesDropdownProps {
  currentDay: number;
  onCopyTo: (targetDays: number[]) => void;
}

export function CopyTimesDropdown({ currentDay, onCopyTo }: CopyTimesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const availableDays = DAYS_OF_WEEK.filter((day) => day.value !== currentDay);

  const handleToggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue) ? prev.filter((d) => d !== dayValue) : [...prev, dayValue]
    );
  };

  const handleSelectAll = () => {
    setSelectedDays(availableDays.map((d) => d.value));
  };

  const handleCopy = () => {
    if (selectedDays.length > 0) {
      onCopyTo(selectedDays);
      setSelectedDays([]);
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setSelectedDays([]);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Copy className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-medium">Kopiraj na</div>
        <DropdownMenuSeparator />
        {availableDays.map((day) => (
          <DropdownMenuItem
            key={day.value}
            className="gap-2"
            onSelect={(e) => {
              e.preventDefault();
              handleToggleDay(day.value);
            }}
          >
            <Checkbox
              checked={selectedDays.includes(day.value)}
              onCheckedChange={() => handleToggleDay(day.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <span>{day.label}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleSelectAll();
          }}
        >
          Izaberi sve
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex gap-2 p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleCancel}
          >
            Otkaži
          </Button>
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={handleCopy}
            disabled={selectedDays.length === 0}
          >
            Kopiraj
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
