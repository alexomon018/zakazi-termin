"use client";

import { CircleX } from "lucide-react";
import { cn } from "../utils";

interface ServerErrorAlertProps {
  message?: string | null;
  className?: string;
}

export function ServerErrorAlert({ message, className }: ServerErrorAlertProps) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800/50 animate-fade-in",
        className
      )}
    >
      <div className="flex gap-2 items-center">
        <CircleX className="flex-shrink-0 w-4 h-4" />
        {message}
      </div>
    </div>
  );
}
