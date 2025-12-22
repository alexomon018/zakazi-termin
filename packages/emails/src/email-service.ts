import { Resend } from "resend";
import { createElement } from "react";
import type { BookingEmailData } from "./types";
import { BookingConfirmedEmail } from "./templates/booking-confirmed";
import { BookingPendingEmail } from "./templates/booking-pending";
import { BookingCancelledEmail } from "./templates/booking-cancelled";
import { BookingRejectedEmail } from "./templates/booking-rejected";
import { BookingConfirmedOrganizerEmail } from "./templates/booking-confirmed-organizer";
import { BookingPendingOrganizerEmail } from "./templates/booking-pending-organizer";
import { BookingRescheduledEmail } from "./templates/booking-rescheduled";
import { WelcomeEmail, type WelcomeEmailProps } from "./templates/welcome";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string = "Zakazi Termin <noreply@zakazi-termin.rs>";

  private getResend(): Resend {
    if (!this.resend) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("RESEND_API_KEY environment variable is not set");
      }
      this.resend = new Resend(apiKey);
    }
    return this.resend;
  }

  async send(options: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      const resend = this.getResend();
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || this.fromEmail,
        to: options.to,
        subject: options.subject,
        react: options.react,
      });

      if (error) {
        console.error("Failed to send email:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Email service error:", errorMessage);
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
      await Promise.all([
        this.sendBookingPending(data),
        this.sendBookingPendingToOrganizer(data),
      ]);
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
      subject: "Dobrodošli na Zakazi Termin!",
      react: createElement(WelcomeEmail, data),
    });
  }
}

export const emailService = new EmailService();
