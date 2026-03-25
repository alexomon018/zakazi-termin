import { formatSalonName } from "@salonko/ui/lib/utils/formatSalonName";
import { UserAvatar } from "@salonko/ui/molecules/user/UserAvatar";
import { Clock, MapPin } from "lucide-react";

interface BookingEventHeaderProps {
  eventTitle: string;
  eventDescription?: string | null;
  eventLength: number;
  eventLocation?: string;
  salonName?: string | null;
  userAvatarUrl?: string | null;
  /** Name of the staff member who created/provides this service */
  staffName?: string | null;
  isRescheduling?: boolean;
}

export function BookingEventHeader({
  eventTitle,
  eventDescription,
  eventLength,
  eventLocation,
  salonName,
  userAvatarUrl,
  staffName,
  isRescheduling,
}: BookingEventHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <div className="flex gap-3 justify-center items-center mb-4">
        <UserAvatar name={salonName || ""} image={userAvatarUrl || undefined} size="lg" />
        {salonName && (
          <div>
            <h1 className="text-xl font-semibold text-foreground">{formatSalonName(salonName)}</h1>
          </div>
        )}
      </div>
      <h2 data-testid="booking-event-title" className="mb-2 text-2xl font-bold text-foreground">
        {isRescheduling ? `Promena termina: ${eventTitle}` : eventTitle}
      </h2>
      {eventDescription && (
        <p
          data-testid="booking-event-description"
          className="mx-auto max-w-lg text-muted-foreground"
        >
          {eventDescription}
        </p>
      )}
      <div className="flex flex-wrap gap-4 justify-center items-center mt-4 text-sm text-muted-foreground">
        <span data-testid="booking-event-duration" className="flex gap-1 items-center">
          <Clock className="w-4 h-4" />
          {eventLength} minuta
        </span>
        {eventLocation && (
          <span data-testid="booking-event-location" className="flex gap-1 items-center">
            <MapPin className="w-4 h-4" />
            {eventLocation}
          </span>
        )}
        {staffName && (
          <span className="flex gap-1 items-center">
            <span className="text-muted-foreground">•</span>
            {staffName}
          </span>
        )}
      </div>
    </div>
  );
}
