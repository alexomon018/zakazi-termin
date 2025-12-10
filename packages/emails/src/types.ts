export interface BookingEmailData {
  // Booking info
  bookingUid: string;
  bookingTitle: string;
  bookingDescription?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;

  // Event type info
  eventTypeTitle: string;
  eventTypeDuration: number;

  // Organizer info
  organizerName: string;
  organizerEmail: string;

  // Attendee info
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  attendeeNotes?: string | null;

  // Optional
  cancellationReason?: string | null;
  rejectionReason?: string | null;
  rescheduledFromDate?: Date | null;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}
