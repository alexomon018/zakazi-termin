export const APP_NAME = "Salonko";
export const DEFAULT_TIMEZONE = "Europe/Belgrade";
export const DEFAULT_LOCALE = "sr";
export const DEFAULT_WEEK_START = "Monday";

// Booking defaults
export const DEFAULT_EVENT_LENGTH = 30; // minutes
export const DEFAULT_MINIMUM_BOOKING_NOTICE = 120; // minutes (2 hours)
export const DEFAULT_SLOT_INTERVAL = 15; // minutes

// Working hours defaults (9 AM - 5 PM)
export const DEFAULT_START_TIME = "09:00";
export const DEFAULT_END_TIME = "17:00";

// Days of week (0 = Sunday, 1 = Monday, etc.)
export const WEEKDAYS = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

// Default working days (Monday - Friday)
export const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5];

// Locales
export const SUPPORTED_LOCALES = ["sr", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// i18n config
export const i18nConfig = {
  defaultLocale: DEFAULT_LOCALE,
  locales: SUPPORTED_LOCALES,
};
