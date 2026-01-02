-- AlterTable
ALTER TABLE "Attendee" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Availability" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "BookingReference" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Credential" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DestinationCalendar" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "EventType" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Membership" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OutOfOffice" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OutOfOfficeReason" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SubscriptionEvent" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT;
