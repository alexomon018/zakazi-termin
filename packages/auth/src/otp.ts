import { randomBytes, randomInt } from "node:crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const AUTO_LOGIN_TOKEN_EXPIRY_MINUTES = 5;

/**
 * Generate a cryptographically secure 6-digit OTP code
 */
export function generateOTP(): string {
  return String(randomInt(0, 1000000)).padStart(OTP_LENGTH, "0");
}

/**
 * Get the expiry date for an OTP (15 minutes from now)
 */
export function getOTPExpiryDate(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * OTP configuration constants
 */
export const OTP_CONFIG = {
  length: OTP_LENGTH,
  expiryMinutes: OTP_EXPIRY_MINUTES,
  maxAttempts: MAX_ATTEMPTS,
  resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
} as const;

/**
 * Generate a cryptographically secure auto-login token (32 bytes hex)
 */
export function generateAutoLoginToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get the expiry date for an auto-login token (5 minutes from now)
 */
export function getAutoLoginTokenExpiryDate(): Date {
  return new Date(Date.now() + AUTO_LOGIN_TOKEN_EXPIRY_MINUTES * 60 * 1000);
}
