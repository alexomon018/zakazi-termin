import { cn } from "@salonko/ui/utils";
import { MapPin } from "lucide-react";

interface LocationDisplayProps {
  location: string;
  truncate?: boolean;
}

export function LocationDisplay({ location, truncate = true }: LocationDisplayProps) {
  return (
    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
      <MapPin className="w-4 h-4" />
      <span className={cn(truncate && "truncate")}>{location}</span>
    </div>
  );
}
