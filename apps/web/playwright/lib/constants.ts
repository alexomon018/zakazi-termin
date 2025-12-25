// Route constants
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",

  // Dashboard routes
  DASHBOARD: "/dashboard",
  EVENT_TYPES: "/dashboard/event-types",
  EVENT_TYPES_NEW: "/dashboard/event-types/new",
  BOOKINGS: "/dashboard/bookings",
  AVAILABILITY: "/dashboard/availability",
  SETTINGS: "/dashboard/settings",
  SETTINGS_PROFILE: "/dashboard/settings/profile",
  SETTINGS_APPEARANCE: "/dashboard/settings/appearance",
  SETTINGS_OUT_OF_OFFICE: "/dashboard/settings/out-of-office",

  // Public booking routes
  publicBookingPage: (username: string) => `/${username}`,
  publicEventType: (username: string, eventSlug: string) =>
    `/${username}/${eventSlug}`,
  eventTypeEdit: (id: number | string) => `/dashboard/event-types/${id}`,
  bookingDetails: (uid: string) => `/booking/${uid}`,
} as const;

// Test data constants
export const TEST_USER = {
  DEFAULT_PASSWORD: "TestPassword123!",
  DEFAULT_TIMEZONE: "Europe/Belgrade",
} as const;

// Selectors - using data-testid when available, falling back to accessible selectors
export const SELECTORS = {
  // Auth forms
  AUTH: {
    EMAIL_INPUT: 'input[name="email"]',
    PASSWORD_INPUT: 'input[name="password"]',
    NAME_INPUT: 'input[name="name"]',
    USERNAME_INPUT: 'input[name="username"]',
    SUBMIT_BUTTON: 'button[type="submit"]',
    GOOGLE_BUTTON: 'button:has-text("Google")',
    LOGIN_LINK: 'a[href="/login"]',
    SIGNUP_LINK: 'a[href="/signup"]',
    FORGOT_PASSWORD_LINK: 'a[href="/forgot-password"]',
  },

  // Navigation
  NAV: {
    DASHBOARD_LINK: 'a[href="/dashboard"]',
    EVENT_TYPES_LINK: 'a[href="/dashboard/event-types"]',
    BOOKINGS_LINK: 'a[href="/dashboard/bookings"]',
    AVAILABILITY_LINK: 'a[href="/dashboard/availability"]',
    SETTINGS_LINK: 'a[href="/dashboard/settings"]',
  },

  // Common UI elements
  UI: {
    LOADING_SPINNER: '[data-testid="loading"]',
    ERROR_MESSAGE: '[data-testid="error"]',
    SUCCESS_MESSAGE: '[data-testid="success"]',
    DIALOG: '[role="dialog"]',
    DIALOG_CLOSE: '[data-testid="dialog-close"]',
  },

  // Event types
  EVENT_TYPE: {
    CREATE_BUTTON: 'a[href="/dashboard/event-types/new"]',
    TITLE_INPUT: 'input[name="title"]',
    SLUG_INPUT: 'input[name="slug"]',
    DESCRIPTION_INPUT: 'textarea[name="description"]',
    DURATION_INPUT: 'input[name="length"]',
    SAVE_BUTTON: 'button[type="submit"]',
    DELETE_BUTTON: '[data-testid="delete-event-type"]',
  },

  // Booking
  BOOKING: {
    TIME_SLOT: '[data-testid="time-slot"]',
    CONFIRM_BUTTON: '[data-testid="confirm-booking"]',
    CANCEL_BUTTON: '[data-testid="cancel-booking"]',
    NAME_INPUT: 'input[name="name"]',
    EMAIL_INPUT: 'input[name="email"]',
    NOTES_INPUT: 'textarea[name="notes"]',
  },
} as const;

// Timeout constants
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  NAVIGATION: 15000,
} as const;
