import { Section, Text, Link } from "@react-email/components";
import * as React from "react";
import { BaseEmail, text, infoBox, infoRow, label, button } from "./base-email";
import type { BookingEmailData } from "../types";

export function BookingConfirmedOrganizerEmail(props: BookingEmailData) {
  const {
    bookingUid,
    eventTypeTitle,
    eventTypeDuration,
    startTime,
    location,
    organizerName,
    attendeeName,
    attendeeEmail,
    attendeePhone,
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

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/bookings`;

  return (
    <BaseEmail
      preview={`Nova rezervacija: ${eventTypeTitle} - ${attendeeName}`}
      heading="Nova rezervacija!"
    >
      <Text style={text}>Poštovani/a {organizerName},</Text>
      <Text style={text}>
        Imate novu potvrđenu rezervaciju. Detalji su u nastavku.
      </Text>

      <Section style={infoBox}>
        <Text style={{ ...infoRow, fontWeight: "600", marginBottom: "8px" }}>
          Detalji termina
        </Text>
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
      </Section>

      <Section style={infoBox}>
        <Text style={{ ...infoRow, fontWeight: "600", marginBottom: "8px" }}>
          Podaci o klijentu
        </Text>
        <Text style={infoRow}>
          <span style={label}>Ime:</span> {attendeeName}
        </Text>
        <Text style={infoRow}>
          <span style={label}>Email:</span>{" "}
          <Link href={`mailto:${attendeeEmail}`}>{attendeeEmail}</Link>
        </Text>
        {attendeePhone && (
          <Text style={infoRow}>
            <span style={label}>Telefon:</span>{" "}
            <Link href={`tel:${attendeePhone}`}>{attendeePhone}</Link>
          </Text>
        )}
        {attendeeNotes && (
          <Text style={infoRow}>
            <span style={label}>Napomena:</span> {attendeeNotes}
          </Text>
        )}
      </Section>

      <Text style={text}>
        Referentni broj: <strong>{bookingUid.slice(0, 8).toUpperCase()}</strong>
      </Text>

      <Section style={{ padding: "0", marginTop: "24px" }}>
        <Link href={dashboardUrl} style={button}>
          Pogledaj sve rezervacije
        </Link>
      </Section>
    </BaseEmail>
  );
}

// Preview props for React Email dev server
BookingConfirmedOrganizerEmail.PreviewProps = {
  bookingUid: "abc12345-test-uid",
  bookingTitle: "Šišanje sa Petar Petrović",
  startTime: new Date("2024-12-25T10:00:00"),
  endTime: new Date("2024-12-25T10:30:00"),
  location: "Bulevar Kralja Aleksandra 123, Beograd",
  eventTypeTitle: "Šišanje",
  eventTypeDuration: 30,
  organizerName: "Marko Marković",
  organizerEmail: "marko@example.com",
  attendeeName: "Petar Petrović",
  attendeeEmail: "petar@example.com",
  attendeePhone: "+381641234567",
  attendeeNotes: "Molim vas da me podsetite dan ranije",
} as BookingEmailData;

export default BookingConfirmedOrganizerEmail;
