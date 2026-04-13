# Payment E2E Tests & Configurable Trial Period

## Overview

This plan covers:
1. **Configurable trial period** - Set to 5 minutes for manual testing
2. **E2E payment tests** - Full flow testing with real Stripe Test Mode

---

## Part 1: Configurable Trial Period

### File: `packages/trpc/src/routers/subscription.ts`

**Change line 31:**
```typescript
// Before
const TRIAL_DAYS = 30;

// After
const TRIAL_PERIOD_MINUTES = parseInt(process.env.TRIAL_PERIOD_MINUTES || "43200", 10); // Default 30 days
const TRIAL_DAYS = Math.ceil(TRIAL_PERIOD_MINUTES / (60 * 24));
```

**Update trial calculation in `startTrial` mutation** to use minutes for precision:
```typescript
const trialEndsAt = new Date(Date.now() + TRIAL_PERIOD_MINUTES * 60 * 1000);
```

### Environment Files

Add to `.env.example`:
```
TRIAL_PERIOD_MINUTES=43200
```

Add to `.env.local` for testing:
```
TRIAL_PERIOD_MINUTES=5
```

Add to `apps/web/.env.test`:
```
TRIAL_PERIOD_MINUTES=5
```

---

## Part 2: E2E Payment Tests

### New File Structure

```
apps/web/playwright/
├── fixtures/
│   ├── index.ts              # UPDATE - add subscription fixture
│   └── subscription.ts       # NEW - subscription test fixture
├── lib/
│   ├── constants.ts          # UPDATE - add billing selectors
│   └── stripe-helpers.ts     # NEW - Stripe test utilities
├── pages/
│   ├── index.ts              # UPDATE - export BillingPage
│   └── BillingPage.ts        # NEW - billing page object
└── payment/
    ├── trial-flow.e2e.ts             # NEW - trial start/banner/expiration
    ├── checkout-flow.e2e.ts          # NEW - Stripe checkout tests
    ├── subscription-management.e2e.ts # NEW - cancel/resume/portal
    └── webhook.e2e.ts                # NEW - webhook processing
```

### 2.1 Create `apps/web/playwright/fixtures/subscription.ts`

Subscription fixture providing:
- `createSubscription(options)` - Create subscription in DB with optional Stripe customer
- `expireTrial(userId)` - Set trial as expired
- `getSubscription(userId)` - Query subscription
- `sendWebhookEvent(type, data)` - Send mock webhook (for test mode)
- `cleanupStripeCustomers()` - Cleanup after tests

### 2.2 Update `apps/web/playwright/fixtures/index.ts`

Merge subscription fixture with existing fixtures.

### 2.3 Create `apps/web/playwright/lib/stripe-helpers.ts`

Utilities for:
- `STRIPE_TEST_CARDS` - Test card numbers (4242..., declined cards, etc.)
- `fillStripeCheckout(page, options)` - Fill Stripe Checkout form
- `submitStripeCheckout(page)` - Submit and wait for redirect
- `completeStripeCheckout(page)` - Full checkout helper
- `createWebhookPayload(type, data)` - Generate test webhook payloads

### 2.4 Create `apps/web/playwright/pages/BillingPage.ts`

Page object with locators and methods for:
- Status card (trial/active/expired)
- Plan selection (monthly/yearly buttons)
- Subscribe button → Stripe redirect
- Cancel/Resume subscription
- Billing portal link
- Invoice history

### 2.5 Update `apps/web/playwright/lib/constants.ts`

Add billing routes and selectors.

### 2.6 Update `apps/web/playwright.config.ts`

- Add `payment` project with longer timeouts for Stripe interactions
- Pass `TRIAL_PERIOD_MINUTES` to webServer env

---

## Part 3: Test Scenarios

### `payment/trial-flow.e2e.ts`
- Trial starts automatically on billing page visit
- Trial banner shows when < 7 days remaining
- Trial banner hidden when > 7 days remaining
- Expired trial shows locked state

### `payment/checkout-flow.e2e.ts`
- Clicking subscribe redirects to Stripe Checkout
- Completing checkout with test card activates subscription
- Declined card shows error
- Canceled checkout shows message

### `payment/subscription-management.e2e.ts`
- Cancel button visible for active subscription
- Resume button visible after canceling
- Billing portal opens correctly
- Invoice history displays

### `payment/webhook.e2e.ts`
- Document Stripe CLI usage for real webhook testing
- Mock webhook tests (requires test mode in handler)

---

## Part 4: Stripe Webhook Testing Strategy

### Option A: Stripe CLI (Recommended)
```bash
# Terminal 1: Start listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Trigger events
stripe trigger checkout.session.completed
```

### Option B: Add Test Mode to Webhook Handler (Optional)

In `apps/web/app/api/webhooks/stripe/route.ts`, add bypass for test signature:
```typescript
if (process.env.NODE_ENV === "test" && signature === "test_signature") {
  event = JSON.parse(body) as Stripe.Event;
} else {
  event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
```

---

## Implementation Order

1. **Configurable trial period** (subscription.ts + env files)
2. **Stripe helpers** (stripe-helpers.ts)
3. **Subscription fixture** (subscription.ts fixture)
4. **BillingPage page object** (BillingPage.ts)
5. **Update fixtures index** (index.ts)
6. **Update constants** (constants.ts)
7. **Trial flow tests** (trial-flow.e2e.ts)
8. **Checkout flow tests** (checkout-flow.e2e.ts)
9. **Subscription management tests** (subscription-management.e2e.ts)
10. **Webhook tests** (webhook.e2e.ts)
11. **Update playwright config** (playwright.config.ts)

---

## Critical Files to Modify

| File | Change |
|------|--------|
| `packages/trpc/src/routers/subscription.ts:31` | Add configurable trial period |
| `apps/web/.env.test` | Add `TRIAL_PERIOD_MINUTES=5` |
| `.env.example` | Document new env var |
| `apps/web/playwright/fixtures/index.ts` | Add subscription fixture |
| `apps/web/playwright/lib/constants.ts` | Add billing selectors |
| `apps/web/playwright.config.ts` | Add payment project |

## New Files to Create

| File | Purpose |
|------|---------|
| `apps/web/playwright/fixtures/subscription.ts` | Subscription test fixture |
| `apps/web/playwright/lib/stripe-helpers.ts` | Stripe test utilities |
| `apps/web/playwright/pages/BillingPage.ts` | Billing page object |
| `apps/web/playwright/payment/trial-flow.e2e.ts` | Trial tests |
| `apps/web/playwright/payment/checkout-flow.e2e.ts` | Checkout tests |
| `apps/web/playwright/payment/subscription-management.e2e.ts` | Management tests |
| `apps/web/playwright/payment/webhook.e2e.ts` | Webhook tests |

---

## Environment Setup for Testing

Ensure `.env.test` has:
```bash
TRIAL_PERIOD_MINUTES=5
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

Run payment tests:
```bash
yarn test:e2e --project=payment
```
