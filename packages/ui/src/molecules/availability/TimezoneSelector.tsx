"use client";

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@salonko/ui";
import { Globe } from "lucide-react";
import { cn } from "../../utils";

const TIMEZONES = [
  { value: "Europe/Belgrade", label: "Beograd" },
  { value: "Europe/Zagreb", label: "Zagreb" },
  { value: "Europe/Sarajevo", label: "Sarajevo" },
  { value: "Europe/Podgorica", label: "Podgorica" },
  { value: "Europe/Skopje", label: "Skoplje" },
  { value: "Europe/Ljubljana", label: "Ljubljana" },
  { value: "Europe/Vienna", label: "Beč" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "Njujork" },
];

export interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimezoneSelector({ value, onChange, className }: TimezoneSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="flex items-center gap-2 text-sm font-medium">
        <Globe className="size-4 text-muted-foreground" />
        Vremenska zona
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Izaberite zonu" />
        </SelectTrigger>
        <SelectContent>
          {TIMEZONES.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
