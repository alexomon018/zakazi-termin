"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { cn } from "@salonko/ui/utils";
import { Edit2, Trash2 } from "lucide-react";

export type OutOfOfficeEntryItemProps = {
  start: Date | string;
  end: Date | string;
  reason?: {
    emoji: string;
    reason: string;
  } | null;
  notes?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
};

function formatDateDisplay(date: Date | string) {
  return new Date(date).toLocaleDateString("sr-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isActiveOrUpcoming(end: Date | string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(end) >= today;
}

function isCurrentlyActive(start: Date | string, end: Date | string) {
  const now = new Date();
  return new Date(start) <= now && new Date(end) >= now;
}

export function OutOfOfficeEntryItem({
  start,
  end,
  reason,
  notes,
  onEdit,
  onDelete,
  isDeleting = false,
}: OutOfOfficeEntryItemProps) {
  const isActive = isActiveOrUpcoming(end);
  const isCurrent = isCurrentlyActive(start, end);

  return (
    <div
      className={cn(
        "flex justify-between items-center p-4 rounded-lg border",
        isActive
          ? "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
          : "bg-gray-50 border-gray-100 opacity-60 dark:bg-gray-800/50 dark:border-gray-700"
      )}
    >
      <div className="flex gap-4 items-center">
        <div
          className={cn(
            "flex justify-center items-center w-10 h-10 text-xl rounded-lg",
            isActive ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-700"
          )}
        >
          {reason?.emoji || "\uD83D\uDCC5"}
        </div>
        <div>
          <div className="flex gap-2 items-center">
            <p className="font-medium text-gray-900 dark:text-white">
              {formatDateDisplay(start)} - {formatDateDisplay(end)}
            </p>
            {isCurrent && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                Aktivno
              </span>
            )}
          </div>
          {reason && <p className="text-sm text-gray-500 dark:text-gray-400">{reason.reason}</p>}
          {notes && <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{notes}</p>}
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={isDeleting}>
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting}>
          <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
        </Button>
      </div>
    </div>
  );
}
