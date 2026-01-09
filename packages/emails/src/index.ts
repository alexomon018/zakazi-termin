export { emailService, type SendEmailOptions } from "./email-service";
export { BookingConfirmedEmail } from "./templates/booking-confirmed";
export { BookingPendingEmail } from "./templates/booking-pending";
export { BookingCancelledEmail } from "./templates/booking-cancelled";
export { BookingRejectedEmail } from "./templates/booking-rejected";
export { BookingConfirmedOrganizerEmail } from "./templates/booking-confirmed-organizer";
export { BookingPendingOrganizerEmail } from "./templates/booking-pending-organizer";
export { BookingRescheduledEmail } from "./templates/booking-rescheduled";
export { WelcomeEmail, type WelcomeEmailProps } from "./templates/welcome";
export { PasswordResetEmail, type PasswordResetEmailProps } from "./templates/password-reset";
export {
  EmailVerificationEmail,
  type EmailVerificationEmailProps,
} from "./templates/email-verification";
export { PaymentFailedEmail } from "./templates/payment-failed";
export { TrialEndingEmail } from "./templates/trial-ending";
export { SubscriptionCanceledEmail } from "./templates/subscription-canceled";
export { SubscriptionExpiredEmail } from "./templates/subscription-expired";
export { SubscriptionSuccessEmail } from "./templates/subscription-success";
export type {
  BookingEmailData,
  PaymentFailedEmailData,
  TrialEndingEmailData,
  SubscriptionCanceledEmailData,
  SubscriptionExpiredEmailData,
  SubscriptionSuccessEmailData,
} from "./types";
