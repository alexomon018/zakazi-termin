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

// Subscription-related email types
export interface SubscriptionEmailData {
  userEmail: string;
  userName: string;
  salonName?: string | null;
}

export interface PaymentFailedEmailData extends SubscriptionEmailData {
  billingPortalUrl: string;
}

export interface TrialEndingEmailData extends SubscriptionEmailData {
  daysRemaining: number;
  billingUrl: string;
}

export interface SubscriptionCanceledEmailData extends SubscriptionEmailData {
  currentPeriodEnd: Date;
  resumeUrl: string;
}

export interface SubscriptionExpiredEmailData extends SubscriptionEmailData {
  billingUrl: string;
}

export interface SubscriptionSuccessEmailData extends SubscriptionEmailData {
  planName: string;
  dashboardUrl: string;
}

// Team-related email types
export interface TeamInviteEmailData {
  inviterName: string;
  organizationName: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  inviteUrl: string;
  recipientEmail: string;
}
