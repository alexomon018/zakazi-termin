"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salonko/ui";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import type { ProfileFormValues } from "./ProfileClient";
import { TIMEZONES } from "./constants";

type TimeZoneCardProps = {
  control: Control<ProfileFormValues>;
};

export function TimeZoneCard({ control }: TimeZoneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Vremenska zona</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timeZone" className="text-gray-900 dark:text-white">
            Vremenska zona
          </Label>
          <Controller
            name="timeZone"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="timeZone" className="w-full">
                  <SelectValue placeholder="Izaberite vremensku zonu" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sva vremena u aplikaciji biće prikazana u ovoj vremenskoj zoni.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
