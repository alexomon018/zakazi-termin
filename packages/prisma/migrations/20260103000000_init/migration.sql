-- Squashed migration: Combines all previous migrations into a single initial migration
-- This migration uses UUID (TEXT with gen_random_uuid()) for all primary keys
-- Decision: Database-level UUID generation via PostgreSQL's gen_random_uuid()

-- Enable pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== ENUMS =====

CREATE TYPE "IdentityProvider" AS ENUM ('EMAIL', 'GOOGLE');

CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'REJECTED');

CREATE TYPE "PeriodType" AS ENUM ('UNLIMITED', 'ROLLING', 'RANGE');

CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID', 'PAUSED');

CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR');

-- ===== ORGANIZATIONS =====

CREATE TABLE "Organization" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Belgrade',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- ===== USERS & AUTH =====

CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT,
    "salonName" TEXT,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Belgrade',
    "weekStart" TEXT NOT NULL DEFAULT 'Monday',
    "locale" TEXT NOT NULL DEFAULT 'sr',
    "identityProvider" "IdentityProvider" NOT NULL DEFAULT 'EMAIL',
    "identityProviderId" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "theme" TEXT,
    "brandColor" TEXT DEFAULT '#292929',
    "darkBrandColor" TEXT DEFAULT '#fafafa',
    "defaultScheduleId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPassword" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL
);

CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- ===== EVENT TYPES =====

CREATE TABLE "EventType" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "length" INTEGER NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "locations" JSONB,
    "minimumBookingNotice" INTEGER NOT NULL DEFAULT 120,
    "beforeEventBuffer" INTEGER NOT NULL DEFAULT 0,
    "afterEventBuffer" INTEGER NOT NULL DEFAULT 0,
    "slotInterval" INTEGER,
    "requiresConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "disableGuests" BOOLEAN NOT NULL DEFAULT false,
    "periodType" "PeriodType" NOT NULL DEFAULT 'UNLIMITED',
    "periodStartDate" TIMESTAMP(3),
    "periodEndDate" TIMESTAMP(3),
    "periodDays" INTEGER,
    "scheduleId" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- ===== SCHEDULES & AVAILABILITY =====

CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Availability" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "scheduleId" TEXT,
    "eventTypeId" TEXT,
    "days" INTEGER[],
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "date" DATE,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- ===== CALENDAR SYNC =====

CREATE TABLE "Credential" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "key" JSONB NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT,
    "invalid" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SelectedCalendar" (
    "userId" TEXT NOT NULL,
    "integration" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "credentialId" TEXT,

    CONSTRAINT "SelectedCalendar_pkey" PRIMARY KEY ("userId", "integration", "externalId")
);

CREATE TABLE "DestinationCalendar" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "integration" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "credentialId" TEXT,
    "userId" TEXT,
    "eventTypeId" TEXT,

    CONSTRAINT "DestinationCalendar_pkey" PRIMARY KEY ("id")
);

-- ===== BOOKINGS =====

CREATE TABLE "Booking" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "uid" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT,
    "eventTypeId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'ACCEPTED',
    "cancellationReason" TEXT,
    "rejectionReason" TEXT,
    "rescheduled" BOOLEAN,
    "fromReschedule" TEXT,
    "responses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Attendee" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'Europe/Belgrade',
    "phoneNumber" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'sr',
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BookingReference" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "meetingId" TEXT,
    "meetingPassword" TEXT,
    "meetingUrl" TEXT,
    "externalCalendarId" TEXT,
    "deleted" BOOLEAN,
    "credentialId" TEXT,
    "bookingId" TEXT,

    CONSTRAINT "BookingReference_pkey" PRIMARY KEY ("id")
);

-- ===== OUT OF OFFICE =====

CREATE TABLE "OutOfOfficeReason" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "emoji" TEXT NOT NULL DEFAULT '🏝️',
    "reason" TEXT NOT NULL,
    "userId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OutOfOfficeReason_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutOfOffice" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "uuid" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "start" DATE NOT NULL,
    "end" DATE NOT NULL,
    "notes" TEXT,
    "reasonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutOfOffice_pkey" PRIMARY KEY ("id")
);

-- ===== SUBSCRIPTIONS =====

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
    "billingInterval" "BillingInterval",
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "lastDunningEmailAt" TIMESTAMP(3),
    "dunningEmailCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SubscriptionEvent" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subscriptionId" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- ===== INDEXES =====

-- Organization
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");

-- Membership
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- User
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_salonName_key" ON "User"("salonName");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_salonName_idx" ON "User"("salonName");

-- UserPassword
CREATE UNIQUE INDEX "UserPassword_userId_key" ON "UserPassword"("userId");

-- Account
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Session
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- VerificationToken
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- EventType
CREATE INDEX "EventType_userId_idx" ON "EventType"("userId");
CREATE INDEX "EventType_scheduleId_idx" ON "EventType"("scheduleId");
CREATE INDEX "EventType_organizationId_idx" ON "EventType"("organizationId");
CREATE UNIQUE INDEX "EventType_userId_slug_key" ON "EventType"("userId", "slug");

-- Schedule
CREATE INDEX "Schedule_userId_idx" ON "Schedule"("userId");

-- Availability
CREATE INDEX "Availability_scheduleId_idx" ON "Availability"("scheduleId");
CREATE INDEX "Availability_eventTypeId_idx" ON "Availability"("eventTypeId");
CREATE INDEX "Availability_userId_idx" ON "Availability"("userId");

-- Credential
CREATE INDEX "Credential_userId_idx" ON "Credential"("userId");
CREATE INDEX "Credential_type_idx" ON "Credential"("type");

-- SelectedCalendar
CREATE INDEX "SelectedCalendar_userId_idx" ON "SelectedCalendar"("userId");
CREATE INDEX "SelectedCalendar_credentialId_idx" ON "SelectedCalendar"("credentialId");

-- DestinationCalendar
CREATE UNIQUE INDEX "DestinationCalendar_userId_key" ON "DestinationCalendar"("userId");
CREATE UNIQUE INDEX "DestinationCalendar_eventTypeId_key" ON "DestinationCalendar"("eventTypeId");
CREATE INDEX "DestinationCalendar_userId_idx" ON "DestinationCalendar"("userId");
CREATE INDEX "DestinationCalendar_credentialId_idx" ON "DestinationCalendar"("credentialId");

-- Booking
CREATE UNIQUE INDEX "Booking_uid_key" ON "Booking"("uid");
CREATE INDEX "Booking_eventTypeId_idx" ON "Booking"("eventTypeId");
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX "Booking_uid_idx" ON "Booking"("uid");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_startTime_endTime_idx" ON "Booking"("startTime", "endTime");

-- Attendee
CREATE INDEX "Attendee_email_idx" ON "Attendee"("email");
CREATE INDEX "Attendee_bookingId_idx" ON "Attendee"("bookingId");

-- BookingReference
CREATE INDEX "BookingReference_bookingId_idx" ON "BookingReference"("bookingId");
CREATE INDEX "BookingReference_credentialId_idx" ON "BookingReference"("credentialId");
CREATE INDEX "BookingReference_type_idx" ON "BookingReference"("type");

-- OutOfOfficeReason
CREATE UNIQUE INDEX "OutOfOfficeReason_reason_key" ON "OutOfOfficeReason"("reason");
CREATE INDEX "OutOfOfficeReason_userId_idx" ON "OutOfOfficeReason"("userId");

-- OutOfOffice
CREATE UNIQUE INDEX "OutOfOffice_uuid_key" ON "OutOfOffice"("uuid");
CREATE INDEX "OutOfOffice_userId_idx" ON "OutOfOffice"("userId");
CREATE INDEX "OutOfOffice_start_end_idx" ON "OutOfOffice"("start", "end");

-- Subscription
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_trialEndsAt_idx" ON "Subscription"("trialEndsAt");
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- SubscriptionEvent
CREATE UNIQUE INDEX "SubscriptionEvent_stripeEventId_key" ON "SubscriptionEvent"("stripeEventId");
CREATE INDEX "SubscriptionEvent_subscriptionId_idx" ON "SubscriptionEvent"("subscriptionId");

-- ===== FOREIGN KEYS =====

-- Membership
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserPassword
ALTER TABLE "UserPassword" ADD CONSTRAINT "UserPassword_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Account
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Session
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventType
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventType" ADD CONSTRAINT "EventType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Schedule
ALTER TABLE "Schedule" ADD CONSTRAINT "Schedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Availability
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Credential
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SelectedCalendar
ALTER TABLE "SelectedCalendar" ADD CONSTRAINT "SelectedCalendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SelectedCalendar" ADD CONSTRAINT "SelectedCalendar_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DestinationCalendar
ALTER TABLE "DestinationCalendar" ADD CONSTRAINT "DestinationCalendar_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DestinationCalendar" ADD CONSTRAINT "DestinationCalendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DestinationCalendar" ADD CONSTRAINT "DestinationCalendar_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Booking
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Attendee
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BookingReference
ALTER TABLE "BookingReference" ADD CONSTRAINT "BookingReference_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OutOfOffice
ALTER TABLE "OutOfOffice" ADD CONSTRAINT "OutOfOffice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutOfOffice" ADD CONSTRAINT "OutOfOffice_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "OutOfOfficeReason"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Subscription
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SubscriptionEvent
ALTER TABLE "SubscriptionEvent" ADD CONSTRAINT "SubscriptionEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
