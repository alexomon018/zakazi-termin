import { Link, Section, Text } from "@react-email/components";
import { getAppUrl } from "@salonko/config";
import { BookingInfoBox } from "../components/BookingInfoBox";
import type { BookingEmailData } from "../types";
import { BaseEmail, button, text } from "./base-email";

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

  const bookingUrl = `${getAppUrl()}/booking/${bookingUid}`;

  return (
    <BaseEmail preview={`Vaš termin "${eventTypeTitle}" je potvrđen`} heading="Termin je potvrđen!">
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>
        Vaš termin je uspešno zakazan. U nastavku se nalaze detalji Vaše rezervacije.
      </Text>

      <BookingInfoBox
        eventTypeTitle={eventTypeTitle}
        eventTypeDuration={eventTypeDuration}
        startTime={startTime}
        location={location}
        organizerName={organizerName}
        attendeeNotes={attendeeNotes}
      />

      <Text style={text}>
        Referentni broj rezervacije: <strong>{bookingUid.slice(0, 8).toUpperCase()}</strong>
      </Text>

      <Section style={{ padding: "0", marginTop: "24px" }}>
        <Link href={bookingUrl} style={button}>
          Pogledaj detalje termina
        </Link>
      </Section>

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako želite da otkažete ili promenite termin, kliknite na dugme iznad ili nas kontaktirajte
        direktno.
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
BookingConfirmedEmail.PreviewProps = {
  bookingUid: "abc12345-test-uid",
  bookingTitle: "Šišanje sa Marko Marković",
  bookingDescription: "Standardno muško šišanje",
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

export default BookingConfirmedEmail;
