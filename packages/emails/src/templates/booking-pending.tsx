import { Section, Text } from "@react-email/components";
import * as React from "react";
import type { BookingEmailData } from "../types";
import { BaseEmail, infoBox, infoRow, label, text } from "./base-email";

export function BookingPendingEmail(props: BookingEmailData) {
  const {
    eventTypeTitle,
    eventTypeDuration,
    startTime,
    location,
    organizerName,
    attendeeName,
    attendeeNotes,
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
      preview={`Zahtev za termin "${eventTypeTitle}" je poslat`}
      heading="Zahtev za termin je poslat"
    >
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>
        Vaš zahtev za termin je primljen i čeka potvrdu. Obavestićemo Vas čim bude odobren.
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
        {attendeeNotes && (
          <Text style={infoRow}>
            <span style={label}>Napomena:</span> {attendeeNotes}
          </Text>
        )}
      </Section>

      <Section style={{ ...infoBox, backgroundColor: "#fef3c7" }}>
        <Text style={{ ...infoRow, margin: 0 }}>
          <strong>Status:</strong> Čeka potvrdu
        </Text>
      </Section>

      <Text style={{ ...text, marginTop: "24px" }}>
        Dobićete email obaveštenje kada Vaš zahtev bude odobren ili odbijen.
      </Text>

      <Text style={text}>
        Hvala na strpljenju!
        <br />
        {organizerName}
      </Text>
    </BaseEmail>
  );
}

// Preview props for React Email dev server
BookingPendingEmail.PreviewProps = {
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
  attendeeNotes: "Molim vas da me podsetite dan ranije",
} as BookingEmailData;

export default BookingPendingEmail;
