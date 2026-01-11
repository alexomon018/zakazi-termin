"use client";

import { cn } from "@salonko/ui/utils";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  error?: string;
  min?: number;
  max?: number;
  testIdPrefix?: string;
  className?: string;
}

export function DurationSelector({
  value,
  onChange,
  label = "Trajanje",
  error,
  min = 5,
  max = 480,
  testIdPrefix = "duration",
  className,
}: DurationSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-gray-900 dark:text-white">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((duration) => (
          <button
            key={duration}
            type="button"
            data-testid={`${testIdPrefix}-${duration}`}
            onClick={() => onChange(duration)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              value === duration
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
          >
            {duration < 60 ? `${duration} min` : `${duration / 60}h`}
          </button>
        ))}
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            data-testid={`${testIdPrefix}-input`}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number.parseInt(e.target.value) || 30)}
            className="w-20"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">min</span>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
