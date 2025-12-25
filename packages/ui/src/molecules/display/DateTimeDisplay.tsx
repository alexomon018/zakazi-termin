import { Calendar } from "lucide-react";
import * as React from "react";

interface DateTimeDisplayProps {
  date: Date;
  locale?: string;
}

export function DateTimeDisplay({ date, locale = "sr-RS" }: DateTimeDisplayProps) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <Calendar className="w-4 h-4" />
      <span>{formatDateTime(date)}</span>
    </div>
  );
}
