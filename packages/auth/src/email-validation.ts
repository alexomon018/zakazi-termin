/**
 * Allowed email domains - common providers only
 * This prevents sign-ups using temporary or disposable email services
 */
const ALLOWED_EMAIL_DOMAINS = [
  // Google
  "gmail.com",
  "googlemail.com",
  // Microsoft
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  // Yahoo
  "yahoo.com",
  "yahoo.co.uk",
  "ymail.com",
  // Apple
  "icloud.com",
  "me.com",
  "mac.com",
  // ProtonMail
  "protonmail.com",
  "proton.me",
  "pm.me",
] as const;

/**
 * Check if an email address uses an allowed email provider
 */
export function isAllowedEmailProvider(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  return ALLOWED_EMAIL_DOMAINS.includes(domain as (typeof ALLOWED_EMAIL_DOMAINS)[number]);
}

/**
 * Get the error message for disallowed email providers (Serbian)
 */
export function getEmailProviderError(): string {
  return "Molimo koristite Gmail, Outlook, Yahoo, iCloud ili ProtonMail adresu";
}
