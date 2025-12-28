import { Clock } from "lucide-react";

interface TimeRangeDisplayProps {
  startTime: Date;
  endTime: Date;
  locale?: string;
}

export function TimeRangeDisplay({ startTime, endTime, locale = "sr-RS" }: TimeRangeDisplayProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <Clock className="w-4 h-4" />
      <span>
        {formatTime(startTime)} - {formatTime(endTime)}
      </span>
    </div>
  );
}
