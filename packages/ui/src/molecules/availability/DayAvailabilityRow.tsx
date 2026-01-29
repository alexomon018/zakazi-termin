"use client";

import { Button, Switch } from "@salonko/ui";
import { Plus } from "lucide-react";
import { cn } from "../../utils";
import { CopyTimesDropdown } from "./CopyTimesDropdown";
import { TimeRangeInput } from "./TimeRangeInput";

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DayAvailabilityRowProps {
  dayValue: number;
  dayLabel: string;
  enabled: boolean;
  timeRanges: TimeRange[];
  onToggle: (enabled: boolean) => void;
  onAddTimeRange: () => void;
  onRemoveTimeRange: (index: number) => void;
  onUpdateTimeRange: (index: number, field: "startTime" | "endTime", value: string) => void;
  onCopyToOtherDays: (targetDays: number[]) => void;
  className?: string;
}

export function DayAvailabilityRow({
  dayValue,
  dayLabel,
  enabled,
  timeRanges,
  onToggle,
  onAddTimeRange,
  onRemoveTimeRange,
  onUpdateTimeRange,
  onCopyToOtherDays,
  className,
}: DayAvailabilityRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr] sm:grid-cols-[140px_1fr] items-start gap-3 py-3.5 border-b border-border/60 last:border-b-0",
        className
      )}
    >
      {/* Toggle and day name */}
      <div className="flex items-center gap-3 h-9">
        <Switch checked={enabled} onCheckedChange={onToggle} activeColor="blue" />
        <span
          className={cn(
            "text-sm font-medium select-none",
            enabled ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {dayLabel}
        </span>
      </div>

      {/* Time ranges */}
      {enabled ? (
        <div className="flex flex-col gap-2">
          {timeRanges.map((range, index) => (
            <div
              key={`${range.startTime}-${range.endTime}-${index}`}
              className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
            >
              <TimeRangeInput
                startTime={range.startTime}
                endTime={range.endTime}
                onStartChange={(value) => onUpdateTimeRange(index, "startTime", value)}
                onEndChange={(value) => onUpdateTimeRange(index, "endTime", value)}
                onRemove={() => onRemoveTimeRange(index)}
                showRemove={timeRanges.length > 1}
              />
              {/* Show add button and copy button only on first row */}
              {index === 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onAddTimeRange}
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Plus className="size-4" />
                  </Button>
                  <CopyTimesDropdown currentDay={dayValue} onCopyTo={onCopyToOtherDays} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center h-9 text-sm text-muted-foreground/70">Nedostupan</div>
      )}
    </div>
  );
}
