"use client";

import { cn } from "@salonko/ui/utils";

export type Reason = {
  id: string;
  emoji: string;
  reason: string;
};

export type ReasonSelectorProps = {
  reasons: Reason[];
  selectedReasonId: string | undefined;
  onSelect: (reasonId: string | undefined) => void;
};

export function ReasonSelector({ reasons, selectedReasonId, onSelect }: ReasonSelectorProps) {
  if (!reasons.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {reasons.map((reason) => (
        <button
          key={reason.id}
          type="button"
          onClick={() => onSelect(selectedReasonId === reason.id ? undefined : reason.id)}
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
            selectedReasonId === reason.id
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
              : "border-border hover:border-border"
          )}
        >
          <span className="text-xl">{reason.emoji}</span>
          <span className="text-sm text-foreground">{reason.reason}</span>
        </button>
      ))}
    </div>
  );
}
