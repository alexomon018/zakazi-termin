import { Section, Text } from "@react-email/components";
import { BookingInfoBox } from "../components/BookingInfoBox";
import type { BookingEmailData } from "../types";
import { BaseEmail, label, text } from "./base-email";

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

  return (
    <BaseEmail preview={`Termin "${eventTypeTitle}" je otkazan`} heading="Termin je otkazan">
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>Obaveštavamo Vas da je sledeći termin otkazan.</Text>

      <BookingInfoBox
        eventTypeTitle={eventTypeTitle}
        eventTypeDuration={eventTypeDuration}
        startTime={startTime}
        location={location}
        organizerName={organizerName}
      />

      {cancellationReason && (
        <Section style={{ padding: "0", marginTop: "16px" }}>
          <Text style={{ ...text, padding: 0 }}>
            <span style={label}>Razlog otkazivanja:</span>
          </Text>
          <Text style={{ ...text, padding: 0, fontStyle: "italic" }}>"{cancellationReason}"</Text>
        </Section>
      )}

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako želite da zakažete novi termin, posetite našu stranicu za zakazivanje.
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
