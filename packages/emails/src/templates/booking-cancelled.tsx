import { Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseEmail, text, infoBox, infoRow, label } from "./base-email";
import type { BookingEmailData } from "../types";

export function BookingCancelledEmail(props: BookingEmailData) {
  const {
    eventTypeTitle,
    eventTypeDuration,
    startTime,
    location,
    organizerName,
    attendeeName,
    cancellationReason,
  } = props;

  const formattedDate = new Date(startTime).toLocaleDateString("sr-RS", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(startTime).toLocaleTimeString("sr-RS", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <BaseEmail
      preview={`Termin "${eventTypeTitle}" je otkazan`}
      heading="Termin je otkazan"
    >
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>
        Obaveštavamo Vas da je sledeći termin otkazan.
      </Text>

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
      </Section>

      {cancellationReason && (
        <Section style={{ padding: "0", marginTop: "16px" }}>
          <Text style={{ ...text, padding: 0 }}>
            <span style={label}>Razlog otkazivanja:</span>
          </Text>
          <Text style={{ ...text, padding: 0, fontStyle: "italic" }}>
            "{cancellationReason}"
          </Text>
        </Section>
      )}

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako želite da zakažete novi termin, posetite našu stranicu za
        zakazivanje.
      </Text>

      <Text style={text}>
        Izvinjavamo se zbog eventualne neugodnosti.
        <br />
        {organizerName}
      </Text>
    </BaseEmail>
  );
}

// Preview props for React Email dev server
BookingCancelledEmail.PreviewProps = {
  bookingUid: "abc12345-test-uid",
  bookingTitle: "Šišanje sa Marko Marković",
  startTime: new Date("2024-12-25T10:00:00"),
  endTime: new Date("2024-12-25T10:30:00"),
  location: "Bulevar Kralja Aleksandra 123, Beograd",
  eventTypeTitle: "Šišanje",
  eventTypeDuration: 30,
  organizerName: "Marko Marković",
  organizerEmail: "marko@example.com",
  attendeeName: "Petar Petrović",
  attendeeEmail: "petar@example.com",
  cancellationReason: "Neočekivane obaveze",
} as BookingEmailData;

export default BookingCancelledEmail;
