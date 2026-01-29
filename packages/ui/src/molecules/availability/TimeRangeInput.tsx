"use client";

import { Button, Input } from "@salonko/ui";
import { Trash2 } from "lucide-react";
import { cn } from "../../utils";

export interface TimeRangeInputProps {
  startTime: string;
  endTime: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

export function TimeRangeInput({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  onRemove,
  showRemove = false,
  className,
}: TimeRangeInputProps) {
  return (
    <div className={cn("flex items-center gap-2 shrink-0", className)}>
      <Input
        type="time"
        value={startTime}
        onChange={(e) => onStartChange(e.target.value)}
        className="w-[100px] sm:w-[110px]"
      />
      <span className="text-muted-foreground shrink-0">-</span>
      <Input
        type="time"
        value={endTime}
        onChange={(e) => onEndChange(e.target.value)}
        className="w-[100px] sm:w-[110px]"
      />
      {showRemove && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
