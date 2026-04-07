"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salonko/ui";
import { Copy, Globe, MoreVertical, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "../../utils";

const DAYS_OF_WEEK = [
  { value: 0, label: "Ned" },
  { value: 1, label: "Pon" },
  { value: 2, label: "Uto" },
  { value: 3, label: "Sre" },
  { value: 4, label: "Čet" },
  { value: 5, label: "Pet" },
  { value: 6, label: "Sub" },
];

interface Availability {
  days: number[];
  startTime: Date;
  endTime: Date;
}

export interface ScheduleListItemProps {
  id: string;
  name: string;
  timeZone: string | null;
  availability: Availability[];
  isDefault: boolean;
  onSetDefault: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  className?: string;
}

function formatTime(date: Date): string {
  const d = new Date(date);
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function formatAvailabilitySummary(availability: Availability[]): string {
  if (!availability || availability.length === 0) {
    return "Nije podešeno";
  }

  // Filter out date overrides (those with empty days arrays in the main schedule)
  const workingHours = availability.filter((a) => a.days && a.days.length > 0);

  if (workingHours.length === 0) {
    return "Nije podešeno";
  }

  // Group by time ranges
  const groups: Map<string, number[]> = new Map();

  for (const entry of workingHours) {
    const timeKey = `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`;
    const existingDays = groups.get(timeKey) || [];
    groups.set(timeKey, [...existingDays, ...entry.days]);
  }

  const summaries: string[] = [];

  for (const [timeRange, days] of groups) {
    const sortedDays = [...new Set(days)].sort((a, b) => {
      // Sort with Monday first (1, 2, 3, 4, 5, 6, 0)
      const orderA = a === 0 ? 7 : a;
      const orderB = b === 0 ? 7 : b;
      return orderA - orderB;
    });

    // Find consecutive day ranges
    const dayRanges: string[] = [];
    let rangeStart = sortedDays[0];
    let rangeEnd = sortedDays[0];

    for (let i = 1; i <= sortedDays.length; i++) {
      const currentDay = sortedDays[i];
      const prevDay = sortedDays[i - 1];

      // Check if consecutive (accounting for wrap from 6 to 0)
      const isConsecutive =
        currentDay !== undefined &&
        ((prevDay === 6 && currentDay === 0) ||
          (prevDay !== 6 && currentDay === prevDay + 1) ||
          (prevDay === 0 && currentDay === undefined));

      if (i === sortedDays.length || !isConsecutive) {
        // End of range
        if (rangeStart === rangeEnd) {
          dayRanges.push(DAYS_OF_WEEK[rangeStart]?.label || "");
        } else {
          dayRanges.push(
            `${DAYS_OF_WEEK[rangeStart]?.label || ""} - ${DAYS_OF_WEEK[rangeEnd]?.label || ""}`
          );
        }
        if (currentDay !== undefined) {
          rangeStart = currentDay;
          rangeEnd = currentDay;
        }
      } else {
        rangeEnd = currentDay;
      }
    }

    summaries.push(`${dayRanges.join(", ")}, ${timeRange}`);
  }

  return summaries.join("\n");
}

export function ScheduleListItem({
  id,
  name,
  timeZone,
  availability,
  isDefault,
  onSetDefault,
  onDuplicate,
  onDelete,
  className,
}: ScheduleListItemProps) {
  const summary = formatAvailabilitySummary(availability);

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:border-muted-foreground/30 transition-colors",
        className
      )}
    >
      <Link href={`/dashboard/availability/${id}`} className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground truncate">{name}</h3>
          {isDefault && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
              Podrazumevani
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{summary}</p>
        {timeZone && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="size-3" />
            {timeZone}
          </p>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isDefault && (
            <>
              <DropdownMenuItem onClick={onSetDefault}>
                <Star className="mr-2 size-4" />
                Postavi kao podrazumevani
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="mr-2 size-4" />
            Dupliraj
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 size-4" />
            Obriši
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
