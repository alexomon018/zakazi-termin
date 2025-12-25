import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import type { BookingEmailData } from "../types";
import { BaseEmail, button, infoBox, infoRow, label, text } from "./base-email";

export function BookingRescheduledEmail(props: BookingEmailData) {
  const {
    bookingUid,
    eventTypeTitle,
    eventTypeDuration,
    startTime,
    location,
    organizerName,
    attendeeName,
    rescheduledFromDate,
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

  const formattedOldDate = rescheduledFromDate
    ? new Date(rescheduledFromDate).toLocaleDateString("sr-RS", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedOldTime = rescheduledFromDate
    ? new Date(rescheduledFromDate).toLocaleTimeString("sr-RS", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/${bookingUid}`;

  return (
    <BaseEmail preview={`Termin "${eventTypeTitle}" je promenjen`} heading="Termin je promenjen">
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>Vaš termin je uspešno promenjen. U nastavku se nalaze novi detalji.</Text>

      {rescheduledFromDate && (
        <Section style={{ ...infoBox, backgroundColor: "#fef2f2", textDecoration: "line-through" }}>
          <Text style={{ ...infoRow, color: "#991b1b" }}>
            <span style={label}>Prethodni termin:</span>
          </Text>
          <Text style={{ ...infoRow, color: "#991b1b" }}>
            {formattedOldDate} u {formattedOldTime}
          </Text>
        </Section>
      )}

      <Section style={{ ...infoBox, backgroundColor: "#ecfdf5" }}>
        <Text style={{ ...infoRow, color: "#065f46", fontWeight: "600" }}>Novi termin:</Text>
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

      <Text style={text}>
        Referentni broj: <strong>{bookingUid.slice(0, 8).toUpperCase()}</strong>
      </Text>

      <Section style={{ padding: "0", marginTop: "24px" }}>
        <Link href={bookingUrl} style={button}>
          Pogledaj detalje termina
        </Link>
      </Section>

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako imate bilo kakvih pitanja, slobodno nas kontaktirajte.
      </Text>

      <Text style={text}>
        Vidimo se!
        <br />
        {organizerName}
      </Text>
    </BaseEmail>
  );
}

// Preview props for React Email dev server
BookingRescheduledEmail.PreviewProps = {
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
  rescheduledFromDate: new Date("2024-12-24T14:00:00"),
} as BookingEmailData;

export default BookingRescheduledEmail;
