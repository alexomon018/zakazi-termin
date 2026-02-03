import { Section, Text } from "@react-email/components";
import { BookingInfoBox } from "../components/BookingInfoBox";
import type { BookingEmailData } from "../types";
import { BaseEmail, infoBox, infoRow, text } from "./base-email";

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

  return (
    <BaseEmail
      preview={`Zahtev za termin "${eventTypeTitle}" je poslat`}
      heading="Zahtev za termin je poslat"
    >
      <Text style={text}>Poštovani/a {attendeeName},</Text>
      <Text style={text}>
        Vaš zahtev za termin je primljen i čeka potvrdu. Obavestićemo Vas čim bude odobren.
      </Text>

      <BookingInfoBox
        eventTypeTitle={eventTypeTitle}
        eventTypeDuration={eventTypeDuration}
        startTime={startTime}
        location={location}
        organizerName={organizerName}
        attendeeNotes={attendeeNotes}
      />

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
