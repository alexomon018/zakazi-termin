import { Section, Text, Link } from "@react-email/components";
import * as React from "react";
import { BaseEmail, text, infoBox, infoRow, label, button, buttonSuccess, buttonDanger } from "./base-email";
import type { BookingEmailData } from "../types";

export function BookingPendingOrganizerEmail(props: BookingEmailData) {
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
      preview={`Novi zahtev za termin: ${eventTypeTitle} - ${attendeeName}`}
      heading="Novi zahtev za termin"
    >
      <Text style={text}>Poštovani/a {organizerName},</Text>
      <Text style={text}>
        Imate novi zahtev za termin koji čeka Vašu potvrdu.
      </Text>

      <Section style={{ ...infoBox, backgroundColor: "#fef3c7" }}>
        <Text style={{ ...infoRow, fontWeight: "600", color: "#92400e" }}>
          Potrebna akcija: Potvrdite ili odbijte zahtev
        </Text>
      </Section>

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

      <Section style={{ padding: "0 48px", marginTop: "24px" }}>
        <Link href={dashboardUrl} style={button}>
          Pregledaj zahteve
        </Link>
      </Section>

      <Text style={{ ...text, marginTop: "16px", fontSize: "12px", color: "#6b7280" }}>
        Molimo Vas da potvrdite ili odbijete zahtev što pre kako bi klijent bio obavešten.
      </Text>
    </BaseEmail>
  );
}
