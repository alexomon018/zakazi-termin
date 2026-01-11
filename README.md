# Salonko

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-11-398CCB?style=flat-square&logo=trpc)](https://trpc.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)

A modern SaaS appointment scheduling platform for salons and service businesses. Built with Next.js 15, TypeScript, and a fully type-safe API layer.

## Features

- **Multi-tenant Organizations** - Support for multiple salons with role-based access (Owner, Admin, Member)
- **Appointment Booking** - Public booking pages with real-time availability
- **Subscription Billing** - Stripe integration with trial periods and multiple plans
- **Google Calendar Sync** - Two-way calendar integration
- **Email Notifications** - Transactional emails for bookings, reminders, and billing
- **Multi-language Support** - Serbian (sr) localization
- **Dark Mode** - Theme switching support

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript 5.7 |
| **UI** | React 19, Tailwind CSS 3.4, shadcn/ui, Radix UI |
| **Database** | PostgreSQL 16 (Neon) + Prisma ORM 5.22 |
| **API** | tRPC (type-safe RPC) |
| **Authentication** | NextAuth.js 4.24 (Email + Google OAuth) |
| **Payments** | Stripe (subscriptions) |
| **Email** | Resend + React Email |
| **Caching** | Upstash Redis |
| **Testing** | Playwright (E2E) |
| **Deployment** | Vercel |
| **Monitoring** | Sentry |
| **Build Tool** | Turborepo |
| **Package Manager** | Yarn 4.12 |

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                           Vercel                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  Next.js 15 App Router                    │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │  │
│  │  │   Pages/    │  │  API Routes  │  │  tRPC Server    │  │  │
│  │  │   App UI    │  │  (webhooks,  │  │  (type-safe     │  │  │
│  │  │             │  │   cron)      │  │   procedures)   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐       ┌─────────────┐       ┌──────────────┐
│     Neon     │       │   Stripe    │       │    Resend    │
│   PostgreSQL │       │  Payments   │       │    Email     │
└──────────────┘       └─────────────┘       └──────────────┘
        │
        └──────► Upstash Redis (session caching, rate limiting)
```

## Project Structure

This is a monorepo managed with Turborepo and Yarn workspaces.

```
zakazi-termin/
├── apps/
│   └── web/                    # Next.js application
│       ├── app/                # App Router pages & API routes
│       ├── components/         # App-specific components
│       └── playwright/         # E2E tests
│
├── packages/
│   ├── auth/                   # NextAuth.js configuration & adapter
│   ├── calendar/               # Google Calendar integration
│   ├── config/                 # Shared configuration (logger, constants)
│   ├── emails/                 # Email templates (React Email)
│   ├── prisma/                 # Database schema & Prisma client
│   ├── scheduling/             # Scheduling business logic
│   ├── trpc/                   # tRPC routers & procedures
│   └── ui/                     # Shared UI components (shadcn/ui + Atomic Design)
│
├── docker-compose.yml          # Local PostgreSQL database
├── turbo.json                  # Turborepo configuration
├── biome.json                  # Linting & formatting config
└── vercel.json                 # Vercel deployment config
```

## External Services

| Service | Purpose | Required |
|---------|---------|----------|
| **Neon** | Serverless PostgreSQL database | Yes |
| **Stripe** | Payment processing & subscription management | Yes |
| **Vercel** | Hosting, deployment, and cron jobs | Yes |
| **Resend** | Transactional email delivery | Yes |
| **Upstash Redis** | Distributed caching & rate limiting | Yes |
| **Google Cloud** | Calendar API & OAuth authentication | Optional |
| **Sentry** | Error tracking & monitoring | Optional |

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn 4+ (via Corepack)
- Docker (for local database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zakazi-termin
   ```

2. **Enable Corepack and install dependencies**
   ```bash
   corepack enable
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your service credentials (see [Environment Variables](#environment-variables))

4. **Start the local database**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   yarn db:push
   yarn db:generate
   ```

6. **Start the development server**
   ```bash
   yarn dev
   ```

   The app will be available at `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Start all dev servers (Turbo) |
| `yarn build` | Production build |
| `yarn lint` | Run Biome linter |
| `yarn lint:fix` | Auto-fix linting issues |
| `yarn format` | Format code with Biome |
| `yarn typecheck` | TypeScript type checking |
| `yarn migrate` | Create (or reuse) a Neon preview branch for your current git branch and push schema to it |
| `yarn db:generate` | Generate Prisma client |
| `yarn db:push` | Push schema to database |
| `yarn db:migrate` | Run database migrations |
| `yarn db:studio` | Open Prisma Studio |
| `yarn clean` | Clean build artifacts |
| `yarn test:e2e` | Run Playwright E2E tests |
| `yarn test:e2e:ui` | Run tests with Playwright UI |

## Testing

The project uses **Playwright** for end-to-end testing with a Page Object pattern.

### Test Structure

```text
apps/web/playwright/
├── fixtures/           # Custom test fixtures (users, prisma)
├── lib/                # Helpers, constants, setup/teardown
├── pages/              # Page Object classes
│   ├── BasePage.ts     # Base abstraction for all pages
│   ├── LoginPage.ts
│   ├── BookingsPage.ts
│   └── ...
└── tests/
    ├── auth/           # Authentication tests
    ├── bookings/       # Booking flow tests
    ├── event-types/    # Event type management tests
    └── ...
```

### Running Tests

```bash
# Start test database
yarn test:db:start

# Run all E2E tests
yarn test:e2e

# Run with Playwright UI
yarn test:e2e:ui

# Run in CI mode
yarn test:e2e:ci

# Stop test database
yarn test:db:stop
```

### Test Configuration

- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI for stability
- **Timeout**: 60 seconds per test
- **Screenshots**: On failure only
- **Video**: Retained on failure

## Component Architecture

The UI package uses **shadcn/ui** components organized following **Atomic Design** principles:

```text
packages/ui/src/
├── atoms/              # Basic building blocks
│   ├── Button.tsx      # CVA-based variants
│   ├── Input.tsx
│   ├── Card.tsx        # Compound component
│   ├── Dialog.tsx      # Radix UI-based
│   └── ...
│
├── molecules/          # Combinations of atoms
│   ├── booking/        # BookingCalendar, TimeSlotsList
│   ├── navigation/     # NavItem, MobileNavItem
│   ├── status/         # StatusBadge
│   └── ...
│
└── organisms/          # Complex feature components
    ├── navigation/     # DashboardNav
    ├── bookings/       # BookingsClient
    ├── event-types/    # EventTypesClient
    ├── settings/       # ProfileClient, BillingClient
    └── ...
```

### Component Patterns

- **shadcn/ui**: Copy-paste components built on Radix UI primitives
- **Compound Components**: Card, Dialog, Accordion
- **Variant-based Styling**: Using `class-variance-authority`
- **forwardRef**: For DOM-exposing components
- **Memoization**: `memo()`, `useCallback`, `useMemo` for performance
- **Radix UI Primitives**: For accessible, unstyled base components

### Adding New Components

```bash
npx shadcn@latest add <component-name>
```

## Code Style & Guidelines

### Tooling

- **Linter/Formatter**: Biome (unified toolchain)
- **Pre-commit Hooks**: Husky + lint-staged

### Formatting Rules

| Rule | Value |
|------|-------|
| Indent | 2 spaces |
| Line width | 100 characters |
| Quotes | Double quotes |
| Semicolons | Always |
| Trailing commas | ES5 |
| Line endings | LF |

### TypeScript

- Strict mode enabled
- ES2022 target
- Bundler module resolution
- Path aliases for all workspace packages (`@salonko/*`)

## API Overview

The backend uses tRPC for type-safe API procedures.

### Routers

| Router | Location | Purpose |
|--------|----------|---------|
| `user` | `packages/trpc/src/routers/user.ts` | User profile management |
| `booking` | `packages/trpc/src/routers/booking.ts` | Appointment CRUD operations |
| `eventType` | `packages/trpc/src/routers/eventType.ts` | Service type configuration |
| `availability` | `packages/trpc/src/routers/availability.ts` | Schedule & working hours |
| `subscription` | `packages/trpc/src/routers/subscription.ts` | Billing & plan management |
| `calendar` | `packages/trpc/src/routers/calendar.ts` | Google Calendar integration |
| `outOfOffice` | `packages/trpc/src/routers/outOfOffice.ts` | Absence/vacation management |

### API Routes

| Endpoint | Purpose |
|----------|---------|
| `/api/trpc/*` | tRPC procedure handler |
| `/api/auth/*` | NextAuth.js endpoints |
| `/api/webhooks/stripe` | Stripe webhook handler |
| `/api/cron/check-trials` | Daily trial expiration check |
| `/api/integrations/google-calendar/*` | OAuth flow for calendar |

## Deployment

### Vercel Setup

1. **Import the repository** to Vercel
2. **Configure build settings**:
   - Build Command: `yarn build`
   - Install Command: `yarn install`
   - Root Directory: `/`
3. **Set environment variables** (see below)
4. **Configure cron job** (already in `vercel.json`):
   - Path: `/api/cron/check-trials`
   - Schedule: `0 9 * * *` (daily at 9 AM UTC)

### Stripe Webhook

1. Create a webhook endpoint in Stripe Dashboard
2. Point to: `https://your-domain.com/api/webhooks/stripe`
3. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### Database (Neon)

1. Create a new project in Neon
2. Copy the connection string to `DATABASE_URL`
3. Run migrations: `yarn db:push`

### Preview branches (Neon)

This repo uses Neon branches for preview/testing. Locally, you can create a preview branch named after your current git branch:

```bash
export NEON_API_KEY="..."
export NEON_PROJECT_ID="..."
export NEON_DB_PASSWORD="..."

yarn migrate
```

Notes:
- Branch name format: `preview/<your-local-branch>`
- Parent branch: tries `preview/develop`, then falls back to `develop`
- To skip applying schema: `yarn migrate --no-apply`

## Environment Variables

### Required

```bash
# Database (Neon)
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="Salonko <noreply@yourdomain.com>"

# Payments (Stripe)
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_YEARLY="price_..."

# Caching (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cron Authentication
CRON_SECRET="your-cron-secret"

# S3 (salon icons)
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="your-s3-bucket-name"

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Salonko"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Europe/Belgrade"
NEXT_PUBLIC_DEFAULT_LOCALE="sr"
```

### S3 credentials (salon icons)

- **AWS_REGION**: the AWS region where your S3 bucket lives (must match the bucket region).
- **AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY**: create an IAM user (or role) with programmatic access.
- **S3_BUCKET_NAME**: the target bucket used for salon icon uploads.

For least-privilege access, grant only S3 permissions needed by the app (head/get/put/delete) for your bucket/prefix. Example policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SalonIconsObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:HeadObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/salon-icons/*"
    },
    {
      "Sid": "ListSalonIconsPrefix",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME",
      "Condition": { "StringLike": { "s3:prefix": ["salon-icons/*"] } }
    }
  ]
}
```

### Optional

```bash
# Google OAuth (for calendar integration)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN="https://..."
SENTRY_AUTH_TOKEN="..."

# Development email override
RESEND_API_KEY_DEV="re_..."
EMAIL_FROM_DEV="Dev <dev@yourdomain.com>"

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."

# Trial period (default: 43200 = 30 days)
TRIAL_PERIOD_MINUTES="43200"
```

## License

Private - All rights reserved.
