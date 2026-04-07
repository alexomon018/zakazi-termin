import { Section, Text } from "@react-email/components";
import { formatDate, formatTime } from "@salonko/config";
import { infoBox, infoRow, label } from "../templates/base-email";

interface BookingInfoBoxProps {
  eventTypeTitle: string;
  eventTypeDuration: number;
  startTime: Date;
  location?: string | null;
  organizerName: string;
  attendeeNotes?: string | null;
}

/**
 * Reusable booking details info box for email templates.
 * Displays event details in a consistent format.
 */
export function BookingInfoBox({
  eventTypeTitle,
  eventTypeDuration,
  startTime,
  location,
  organizerName,
  attendeeNotes,
}: BookingInfoBoxProps) {
  const formattedDate = formatDate(startTime);
  const formattedTime = formatTime(startTime);

  return (
    <Section style={infoBox}>
      <Text style={infoRow}>
        <span style={label}>Usluga:</span> {eventTypeTitle}
      </Text>
      <Text style={infoRow}>
        <span style={label}>Datum:</span> {formattedDate}
      </Text>
      <Text style={infoRow}>
        <span style={label}>Vreme:</span> {formattedTime}
      </Text>
      <Text style={infoRow}>
        <span style={label}>Trajanje:</span> {eventTypeDuration} minuta
      </Text>
      {location && (
        <Text style={infoRow}>
          <span style={label}>Lokacija:</span> {location}
        </Text>
      )}
      <Text style={infoRow}>
        <span style={label}>Sa:</span> {organizerName}
      </Text>
      {attendeeNotes && (
        <Text style={infoRow}>
          <span style={label}>Napomena:</span> {attendeeNotes}
        </Text>
      )}
    </Section>
  );
}
