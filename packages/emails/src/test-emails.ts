import { emailService } from "./email-service";
import type { WelcomeEmailProps } from "./templates/welcome";
import type { BookingEmailData } from "./types";

const TEST_EMAIL = "zakaziterm@gmail.com";

const mockBookingData: BookingEmailData = {
  bookingUid: "abc12345-test-uid",
  bookingTitle: "Šišanje sa Marko Marković",
  bookingDescription: "Standardno muško šišanje",
  startTime: new Date("2024-12-25T10:00:00"),
  endTime: new Date("2024-12-25T10:30:00"),
  location: "Bulevar Kralja Aleksandra 123, Beograd",
  eventTypeTitle: "Šišanje",
  eventTypeDuration: 30,
  organizerName: "Marko Marković",
  organizerEmail: TEST_EMAIL,
  attendeeName: "Petar Petrović",
  attendeeEmail: TEST_EMAIL,
  attendeePhone: "+381641234567",
  attendeeNotes: "Molim vas da me podsetite dan ranije",
  cancellationReason: "Neočekivane obaveze",
  rejectionReason: "Termin nije dostupan tog dana",
  rescheduledFromDate: new Date("2024-12-24T14:00:00"),
};

const mockWelcomeData: WelcomeEmailProps = {
  userName: "Marko Marković",
  userEmail: TEST_EMAIL,
  salonName: "marko-salon",
};

async function sendAllTestEmails() {
  console.log("📧 Sending test emails to:", TEST_EMAIL);
  console.log("-----------------------------------\n");

  const emails = [
    {
      name: "Welcome Email",
      send: () => emailService.sendWelcomeEmail(mockWelcomeData),
    },
    {
      name: "Booking Confirmed (Attendee)",
      send: () => emailService.sendBookingConfirmed(mockBookingData),
    },
    {
      name: "Booking Confirmed (Organizer)",
      send: () => emailService.sendBookingConfirmedToOrganizer(mockBookingData),
    },
    {
      name: "Booking Pending (Attendee)",
      send: () => emailService.sendBookingPending(mockBookingData),
    },
    {
      name: "Booking Pending (Organizer)",
      send: () => emailService.sendBookingPendingToOrganizer(mockBookingData),
    },
    {
      name: "Booking Cancelled",
      send: () => emailService.sendBookingCancelled(mockBookingData),
    },
    {
      name: "Booking Rejected",
      send: () => emailService.sendBookingRejected(mockBookingData),
    },
    {
      name: "Booking Rescheduled",
      send: () => emailService.sendBookingRescheduled(mockBookingData),
    },
  ];

  for (const email of emails) {
    try {
      console.log(`📤 Sending: ${email.name}...`);
      await email.send();
      console.log(`✅ Sent: ${email.name}\n`);
    } catch (error) {
      console.error(`❌ Failed: ${email.name}`, error, "\n");
    }
    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("-----------------------------------");
  console.log("✨ All test emails sent!");
}

sendAllTestEmails();
