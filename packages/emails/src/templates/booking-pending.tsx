import { Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseEmail, text, infoBox, infoRow, label } from "./base-email";
import type { BookingEmailData } from "../types";

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
        Vaš zahtev za termin je primljen i čeka potvrdu. Obavestićemo Vas čim
        bude odobren.
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

      <Text style={{ ...text, backgroundColor: "#fef3c7", padding: "12px 48px", borderRadius: "4px" }}>
        <strong>Status:</strong> Čeka potvrdu
      </Text>

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
