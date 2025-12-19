import * as React from "react";
import { Clock, MapPin } from "lucide-react";
import { UserAvatar } from "../user/UserAvatar";

interface BookingEventHeaderProps {
  eventTitle: string;
  eventDescription?: string | null;
  eventLength: number;
  eventLocation?: string;
  userName?: string | null;
  userAvatarUrl?: string | null;
  isRescheduling?: boolean;
}

export function BookingEventHeader({
  eventTitle,
  eventDescription,
  eventLength,
  eventLocation,
  userName,
  userAvatarUrl,
  isRescheduling,
}: BookingEventHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <div className="flex gap-3 justify-center items-center mb-4">
        <UserAvatar name={userName || ""} image={userAvatarUrl || undefined} size="lg" />
        {userName && (
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {userName}
            </h1>
          </div>
        )}
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {isRescheduling ? `Promena termina: ${eventTitle}` : eventTitle}
      </h2>
      {eventDescription && (
        <p className="mx-auto max-w-lg text-gray-600 dark:text-gray-400">
          {eventDescription}
        </p>
      )}
      <div className="flex gap-4 justify-center items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
        <span className="flex gap-1 items-center">
          <Clock className="w-4 h-4" />
          {eventLength} minuta
        </span>
        {eventLocation && (
          <span className="flex gap-1 items-center">
            <MapPin className="w-4 h-4" />
            {eventLocation}
          </span>
        )}
      </div>
    </div>
  );
}
