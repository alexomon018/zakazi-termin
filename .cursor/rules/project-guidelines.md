# CLAUDE.md

This file provides guidance to Cursor when working with code in this repository.

## Project Overview

Zakazi Termin (internally "salonko") is a booking/scheduling application for salons built with Next.js 15, tRPC, Prisma, and Stripe. Serbian market focus with Europe/Belgrade timezone default.

## Commands

```bash
# Development
yarn dev                    # Start all workspaces (runs Next.js dev server)
yarn build                  # Build all packages
yarn typecheck              # Run TypeScript checks across all packages
yarn lint                   # Run Biome linter
yarn lint:fix               # Fix linting issues

# Database
yarn db:generate            # Generate Prisma client
yarn db:push                # Push schema to database (no migrations)
yarn db:migrate             # Run database migrations
yarn db:studio              # Open Prisma Studio

# E2E Testing (requires test database running)
yarn test:db:start          # Start test PostgreSQL container (port 5433)
yarn test:db:stop           # Stop test database container
yarn test:e2e               # Run Playwright tests
yarn test:e2e:ui            # Run Playwright with UI mode

# Run single test file
yarn workspace @salonko/web test:e2e playwright/auth/login.e2e.ts
```


## Architecture

### Monorepo Structure (Yarn Workspaces + Turborepo)

**apps/web** - Next.js 15 app with App Router
- Route groups: `(auth)`, `(booking)`, `(dashboard)`
- Public booking: `[salonName]/[eventSlug]` routes
- Dashboard at `/dashboard/*` for authenticated users
- Uses shadcn/ui (new-york style) with Radix primitives

**packages/**
- `@salonko/trpc` - tRPC router with all API procedures
- `@salonko/prisma` - Prisma schema, client (output: `generated/client`)
- `@salonko/auth` - NextAuth.js config with email/Google providers
- `@salonko/emails` - React Email templates with Resend
- `@salonko/ui` - Shared components (atoms/molecules/organisms pattern)
- `@salonko/scheduling` - Availability slot calculation logic
- `@salonko/calendar` - Google Calendar integration
- `@salonko/config` - Shared configuration and dayjs setup

### tRPC Setup

Routers in `packages/trpc/src/routers/`: user, eventType, booking, availability, calendar, outOfOffice, subscription

**Client usage:**
```typescript
// Client components - use hook
import { trpc } from "@/lib/trpc/client";
const { data } = trpc.user.me.useQuery();

// Server components - use caller
import { createServerCaller } from "@/lib/trpc/server";
const caller = await createServerCaller();
const user = await caller.user.me();
```

### E2E Testing Structure

Tests in `apps/web/playwright/` with Page Object pattern:
- `fixtures/` - Prisma client and user creation fixtures
- `pages/` - Page objects (LoginPage, BookingsPage, etc.)
- Test files use `.e2e.ts` extension

Tests auto-setup database schema via global setup. Requires `.env.test` with `DATABASE_URL` pointing to port 5433.

## Key Patterns

- Biome for linting/formatting (not ESLint/Prettier)
- Forms use react-hook-form + zod validation
- Date handling uses dayjs (configured in @salonko/config)
- Subscription/billing via Stripe with trial periods
- All database IDs use UUID via `gen_random_uuid()`


## After you finish you can run typescript check to make sure there are no errors.
```bash
yarn tsc
```

and also you can run biome check to make sure there are no errors.
```bash
yarn lint:fix
```

# Red Alert Rules (Break = Block)

1. **Zero-Duplication Doctrine**: If a utility exists, _use or extend it_. Re-implementing behavior is technical vandalism.

2. **Mandatory Repo Crawl Before Typing**: Ripgrep the codebase first. If you reinvent an existing function, we'll pin it in a shame-PR.

3. **Scope-Laser Mode**: Edit _only_ files required for the ticket. Touching >2 unrelated modules? Stop. Ping a human. If the change feels "large" (≥200 LOC _or_ ≥5 files), flag **Need-Human-Approval** and wait. No "while I'm here" drive-bys.

4. **One Purpose / One Function**: "And also..." means split it.

5. **Atomic Commits**: One logical change per commit. Unrelated edits = reject.

6. **DRY or Die Tryin'**: 2 copies = warning. 3 copies = felony. CI will fail on detectable duplication.

7. **Expand, Don't Explode**: Extend existing utilities; never fork a `v2` copy-paste tree.

8. **Simplicity Tax**: If reviewers need >30s to grok a diff, refactor until they don't.

9. **Comment Quota Enforcement**: If code needs a paragraph to explain, the code is wrong. Fix the code, then re-evaluate comments.

10. **Kill Dead Code**: Remove unused paths / flags / TODO fossils.

11. **Performance Is a Feature**: New/changed code must meet _or beat_ existing util perf. Slower? Justify with numbers or expect revert.

12. **Linter = Law**: A red biome line is a hard stop. Fix or explain. No merges on lint errors.

13. **Context > Cleverness**: Readable beats wizardry. Explain to a sleepy intern in <60s.

14. **Fail Fast, Loud, Early**: Assert aggressively. Silent failures are sabotage.

15. **Docs or It Didn't Ship**: Public utilities need JSDoc/TSDoc. Private helpers: inline types are fine but must be clear.

16. **Use the existing utilities and patterns in the codebase**: Do not reinvent the wheel.

17. **Never use window prompts or alerts always use the components from the ui package**: use shadcn/ui Dialog component for alerts.

## Dependency and Constant Management

- If a constant is only used by one file, always prefer dependency injection with a default value instead of relying on the constant being available in closure scope. We can always use it as the default value for that argument.

---

## Architecture

### Atomic Design Pattern

The codebase strictly follows atomic design methodology:

- **atoms/**: Basic building blocks (Button, Input, Badge, Avatar, ProductImage, etc.)
- **molecules/**: Simple component groups (ProductCard, SearchBar, ImageCarousel, SellerInfo, etc.)
- **organisms/**: Complex component assemblies (ProductGrid, FilterPanel, Header, ProductReviews, etc.)

### Import Aliases

Use the configured TypeScript path aliases:

```tsx
import { Button } from "@atoms";
import { ProductCard } from "@molecules";
import { Header } from "@organisms";
import { apiClient } from "@/api";
import { cn } from "@/lib/utils";
```