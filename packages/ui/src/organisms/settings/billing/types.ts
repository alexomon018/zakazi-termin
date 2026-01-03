import type { RouterOutputs } from "@salonko/trpc";

export type SubscriptionStatus = RouterOutputs["subscription"]["getStatus"];
export type Invoice = RouterOutputs["subscription"]["getInvoices"]["invoices"][number];
