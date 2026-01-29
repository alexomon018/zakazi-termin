"use client";

import { Button } from "@salonko/ui";
import { format } from "date-fns";
import { sr } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { cn } from "../../utils";

export interface DateOverrideItemProps {
  date: Date;
  startTime: string;
  endTime: string;
  isBlocked: boolean;
  onRemove: () => void;
  className?: string;
}

export function DateOverrideItem({
  date,
  startTime,
  endTime,
  isBlocked,
  onRemove,
  className,
}: DateOverrideItemProps) {
  const formattedDate = format(date, "EEEE, d. MMMM yyyy.", { locale: sr });

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3 border-b border-border last:border-b-0",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground capitalize">{formattedDate}</p>
        <p className="text-sm text-muted-foreground">
          {isBlocked ? "Nedostupan" : `${startTime} - ${endTime}`}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
