import { Section, Text, Link, Button } from "@react-email/components";
import * as React from "react";
import { BaseEmail, text, infoBox, infoRow, label, button } from "./base-email";
import type { BookingEmailData } from "../types";

export function BookingConfirmedEmail(props: BookingEmailData) {
  const {
    bookingUid,
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

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/booking/${bookingUid}`;

  return (
    <BaseEmail
      preview={`Vaš termin "${eventTypeTitle}" je potvrđen`}
      heading="Termin je potvrđen!"
    >
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>
        Vaš termin je uspešno zakazan. U nastavku se nalaze detalji Vaše
        rezervacije.
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

      <Text style={text}>
        Referentni broj rezervacije:{" "}
        <strong>{bookingUid.slice(0, 8).toUpperCase()}</strong>
      </Text>

      <Section style={{ padding: "0 48px", marginTop: "24px" }}>
        <Link href={bookingUrl} style={button}>
          Pogledaj detalje termina
        </Link>
      </Section>

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako želite da otkažete ili promenite termin, kliknite na dugme iznad ili
        nas kontaktirajte direktno.
      </Text>

      <Text style={text}>
        Vidimo se!
        <br />
        {organizerName}
      </Text>
    </BaseEmail>
  );
}
