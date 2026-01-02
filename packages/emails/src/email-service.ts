import { logger } from "@salonko/config";
import type { ReactElement } from "react";
import { createElement } from "react";
import { Resend } from "resend";
import { BookingCancelledEmail } from "./templates/booking-cancelled";
import { BookingConfirmedEmail } from "./templates/booking-confirmed";
import { BookingConfirmedOrganizerEmail } from "./templates/booking-confirmed-organizer";
import { BookingPendingEmail } from "./templates/booking-pending";
import { BookingPendingOrganizerEmail } from "./templates/booking-pending-organizer";
import { BookingRejectedEmail } from "./templates/booking-rejected";
import { BookingRescheduledEmail } from "./templates/booking-rescheduled";
import { PasswordResetEmail, type PasswordResetEmailProps } from "./templates/password-reset";
import { PaymentFailedEmail } from "./templates/payment-failed";
import { SubscriptionCanceledEmail } from "./templates/subscription-canceled";
import { SubscriptionExpiredEmail } from "./templates/subscription-expired";
import { TrialEndingEmail } from "./templates/trial-ending";
import { WelcomeEmail, type WelcomeEmailProps } from "./templates/welcome";
import type {
  BookingEmailData,
  PaymentFailedEmailData,
  SubscriptionCanceledEmailData,
  SubscriptionExpiredEmailData,
  TrialEndingEmailData,
} from "./types";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

class EmailService {
  private resend: Resend | null = null;
  private fromEmail = "Salonko <noreply@salonko.rs>";

  private isDevEnvironment(): boolean {
    // Local development
    if (process.env.NODE_ENV === "development") {
      return true;
    }
    // Vercel preview deployments
    if (process.env.VERCEL_ENV === "preview") {
      return true;
    }
    return false;
  }

  private getResend(): Resend {
    if (!this.resend) {
      const isDev = this.isDevEnvironment();
      const apiKey = isDev
        ? process.env.RESEND_API_KEY_DEV || process.env.RESEND_API_KEY
        : process.env.RESEND_API_KEY;

      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  private getFromEmail(): string {
    const isDev = this.isDevEnvironment();
    if (isDev) {
      return process.env.EMAIL_FROM_DEV || process.env.EMAIL_FROM || this.fromEmail;
    }
    return process.env.EMAIL_FROM || this.fromEmail;
  }

  async send(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const resend = this.getResend();
      const { error } = await resend.emails.send({
        from: this.getFromEmail(),
        to: options.to,
        subject: options.subject,
        react: options.react,
      });

      if (error) {
        logger.error("Failed to send email", { error, to: options.to, subject: options.subject });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logger.error("Email service error", { error: err, to: options.to, subject: options.subject });
      return { success: false, error: errorMessage };
    }
  }

  // Send booking confirmation to attendee
  async sendBookingConfirmed(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.attendeeEmail,
      subject: `Potvrda termina: ${data.eventTypeTitle}`,
      react: createElement(BookingConfirmedEmail, data),
    });
  }

  // Send booking confirmation to organizer
  async sendBookingConfirmedToOrganizer(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.organizerEmail,
      subject: `Nova rezervacija: ${data.eventTypeTitle} - ${data.attendeeName}`,
      react: createElement(BookingConfirmedOrganizerEmail, data),
    });
  }

  // Send pending booking notification to attendee
  async sendBookingPending(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.attendeeEmail,
      subject: `Zahtev za termin: ${data.eventTypeTitle}`,
      react: createElement(BookingPendingEmail, data),
    });
  }

  // Send pending booking notification to organizer
  async sendBookingPendingToOrganizer(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.organizerEmail,
      subject: `Novi zahtev za termin: ${data.eventTypeTitle} - ${data.attendeeName}`,
      react: createElement(BookingPendingOrganizerEmail, data),
    });
  }

  // Send cancellation notification to attendee
  async sendBookingCancelled(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.attendeeEmail,
      subject: `Termin otkazan: ${data.eventTypeTitle}`,
      react: createElement(BookingCancelledEmail, data),
    });
  }

  // Send cancellation notification to organizer
  async sendBookingCancelledToOrganizer(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.organizerEmail,
      subject: `Termin otkazan: ${data.eventTypeTitle} - ${data.attendeeName}`,
      react: createElement(BookingCancelledEmail, data),
    });
  }

  // Send rejection notification to attendee
  async sendBookingRejected(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.attendeeEmail,
      subject: `Zahtev odbijen: ${data.eventTypeTitle}`,
      react: createElement(BookingRejectedEmail, data),
    });
  }

  // Send reschedule notification to attendee
  async sendBookingRescheduled(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.attendeeEmail,
      subject: `Termin promenjen: ${data.eventTypeTitle}`,
      react: createElement(BookingRescheduledEmail, data),
    });
  }

  // Send reschedule notification to organizer
  async sendBookingRescheduledToOrganizer(data: BookingEmailData): Promise<void> {
    await this.send({
      to: data.organizerEmail,
      subject: `Termin promenjen: ${data.eventTypeTitle} - ${data.attendeeName}`,
      react: createElement(BookingRescheduledEmail, data),
    });
  }

  // Convenience method to send all notifications for a new booking
  async sendNewBookingEmails(data: BookingEmailData, isPending: boolean): Promise<void> {
    if (isPending) {
      await Promise.all([this.sendBookingPending(data), this.sendBookingPendingToOrganizer(data)]);
    } else {
      await Promise.all([
        this.sendBookingConfirmed(data),
        this.sendBookingConfirmedToOrganizer(data),
      ]);
    }
  }

  // Convenience method to send confirmation emails (when organizer confirms pending booking)
  async sendBookingConfirmationEmails(data: BookingEmailData): Promise<void> {
    await this.sendBookingConfirmed(data);
  }

  // Convenience method to send cancellation emails
  async sendBookingCancellationEmails(data: BookingEmailData): Promise<void> {
    await Promise.all([
      this.sendBookingCancelled(data),
      this.sendBookingCancelledToOrganizer(data),
    ]);
  }

  // Convenience method to send reschedule emails
  async sendBookingRescheduleEmails(data: BookingEmailData): Promise<void> {
    await Promise.all([
      this.sendBookingRescheduled(data),
      this.sendBookingRescheduledToOrganizer(data),
    ]);
  }

  // Send welcome email to new user
  async sendWelcomeEmail(data: WelcomeEmailProps): Promise<void> {
    await this.send({
      to: data.userEmail,
      subject: "Dobrodošli na Salonko!",
      react: createElement(WelcomeEmail, data),
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(data: PasswordResetEmailProps): Promise<void> {
    await this.send({
      to: data.userEmail,
      subject: "Resetujte vašu lozinku - Salonko",
      react: createElement(PasswordResetEmail, data),
    });
  }

  // Subscription-related emails

  // Send payment failed notification
  async sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<void> {
    await this.send({
      to: data.userEmail,
      subject: "Plaćanje nije uspelo - Salonko",
      react: createElement(PaymentFailedEmail, data),
    });
  }

  // Send trial ending reminder (3 days before)
  async sendTrialEndingEmail(data: TrialEndingEmailData): Promise<void> {
    const daysText = data.daysRemaining === 1 ? "dan" : "dana";
    await this.send({
      to: data.userEmail,
      subject: `Probni period ističe za ${data.daysRemaining} ${daysText} - Salonko`,
      react: createElement(TrialEndingEmail, data),
    });
  }

  // Send subscription canceled confirmation
  async sendSubscriptionCanceledEmail(data: SubscriptionCanceledEmailData): Promise<void> {
    await this.send({
      to: data.userEmail,
      subject: "Pretplata otkazana - Salonko",
      react: createElement(SubscriptionCanceledEmail, data),
    });
  }

  // Send subscription expired notification
  async sendSubscriptionExpiredEmail(data: SubscriptionExpiredEmailData): Promise<void> {
    await this.send({
      to: data.userEmail,
      subject: "Pretplata istekla - Salonko",
      react: createElement(SubscriptionExpiredEmail, data),
    });
  }
}

export const emailService = new EmailService();
