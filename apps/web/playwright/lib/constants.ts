// Route constants
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",

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
  SETTINGS_BILLING: "/dashboard/settings/billing",

  // Public booking routes
  publicBookingPage: (salonName: string) => `/${salonName}`,
  publicEventType: (salonName: string, eventSlug: string) => `/${salonName}/${eventSlug}`,
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
    SALON_NAME_INPUT: 'input[name="salonName"]',
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
    // Sidebar specific selectors
    SIDEBAR: '[data-testid="dashboard-sidebar"]',
    SIDEBAR_NAV: '[data-testid="sidebar-nav"]',
    SIDEBAR_USER_DROPDOWN: '[data-testid="sidebar-user-dropdown"]',
    // Mobile specific selectors
    MOBILE_TOP_BAR: '[data-testid="mobile-top-bar"]',
    MOBILE_BOTTOM_NAV: '[data-testid="mobile-bottom-nav"]',
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

  // Billing
  BILLING: {
    STATUS_CARD: '[data-testid="billing-status-card"]',
    TRIAL_ACTIVE: '[data-testid="trial-active"]',
    SUBSCRIPTION_ACTIVE: '[data-testid="subscription-active"]',
    SUBSCRIPTION_EXPIRED: '[data-testid="subscription-expired"]',
    PLAN_PICKER: '[data-testid="billing-plan-picker"]',
    // Legacy selectors (kept for backwards compatibility)
    PLAN_MONTHLY: '[data-testid="plan-monthly"]',
    PLAN_YEARLY: '[data-testid="plan-yearly"]',
    // New plan tier selectors (4-plan model)
    PLAN_STARTER: '[data-testid="plan-starter"]',
    PLAN_GROWTH: '[data-testid="plan-growth"]',
    PLAN_GROWTH_YEARLY: '[data-testid="plan-growth_yearly"]',
    PLAN_WEB_PRESENCE: '[data-testid="plan-web_presence"]',
    SUBSCRIBE_BUTTON: '[data-testid="subscribe-button"]',
    MANAGE_SUBSCRIPTION_CARD: '[data-testid="manage-subscription-card"]',
    MANAGE_PAYMENT_BUTTON: '[data-testid="manage-payment-button"]',
    CANCEL_SUBSCRIPTION_BUTTON: '[data-testid="cancel-subscription-button"]',
    RESUME_SUBSCRIPTION_BUTTON: '[data-testid="resume-subscription-button"]',
    // Change plan (new 4-plan model)
    CHANGE_PLAN_CARD: '[data-testid="change-plan-card"]',
    CHANGE_PLAN_DIALOG: '[data-testid="change-plan-dialog"]',
    // Legacy upgrade/downgrade selectors (kept for backwards compatibility)
    UPGRADE_YEARLY_CARD: '[data-testid="upgrade-yearly-card"]',
    UPGRADE_YEARLY_BUTTON: '[data-testid="upgrade-yearly-button"]',
    UPGRADE_YEARLY_DIALOG: '[data-testid="upgrade-yearly-dialog"]',
    CONFIRM_UPGRADE_BUTTON: '[data-testid="confirm-upgrade-button"]',
    DOWNGRADE_MONTHLY_CARD: '[data-testid="downgrade-monthly-card"]',
    DOWNGRADE_MONTHLY_BUTTON: '[data-testid="downgrade-monthly-button"]',
    DOWNGRADE_MONTHLY_DIALOG: '[data-testid="downgrade-monthly-dialog"]',
    CONFIRM_DOWNGRADE_BUTTON: '[data-testid="confirm-downgrade-button"]',
    CANCEL_SUBSCRIPTION_DIALOG: '[data-testid="cancel-subscription-dialog"]',
    CONFIRM_CANCEL_BUTTON: '[data-testid="confirm-cancel-button"]',
    DISMISS_CANCEL_BUTTON: '[data-testid="dismiss-cancel-button"]',
    INVOICE_HISTORY_CARD: '[data-testid="invoice-history-card"]',
  },
} as const;

// Timeout constants
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 30000,
  NAVIGATION: 15000,
} as const;
