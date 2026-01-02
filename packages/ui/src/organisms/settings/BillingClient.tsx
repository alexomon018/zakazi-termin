"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import {
  AlertCircle,
  Check,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type SubscriptionStatus = RouterOutputs["subscription"]["getStatus"];

type BillingClientProps = {
  initialStatus: SubscriptionStatus;
};

const PRICES = {
  monthly: { amount: "5.000", period: "mesečno" },
  yearly: { amount: "50.000", period: "godišnje", savings: "2 meseca besplatno" },
};

export function BillingClient({ initialStatus }: BillingClientProps) {
  const searchParams = useSearchParams();
  const isLocked = searchParams.get("locked") === "true";
  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");

  const utils = trpc.useUtils();

  const { data: status, refetch } = trpc.subscription.getStatus.useQuery(undefined, {
    initialData: initialStatus,
  });

  // Refetch status when returning from Stripe checkout
  useEffect(() => {
    if (success) {
      // Poll for status update as webhook may take a moment
      const pollInterval = setInterval(() => {
        refetch();
      }, 1000);

      // Stop polling after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
      }, 10000);

      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [success, refetch]);

  const createCheckout = trpc.subscription.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const createPortal = trpc.subscription.createPortalSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  const cancelSubscription = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const resumeSubscription = trpc.subscription.resume.useMutation({
    onSuccess: () => {
      utils.subscription.getStatus.invalidate();
    },
  });

  const { data: invoicesData, isLoading: invoicesLoading } =
    trpc.subscription.getInvoices.useQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Naplata</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">Upravljajte svojom pretplatom</p>
      </div>

      {/* Lock Warning */}
      {isLocked && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-300">
            Vaša pretplata je istekla. Pretplatite se da biste nastavili da koristite sve funkcije.
          </span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">
            Uspešno ste se pretplatili! Hvala vam.
          </span>
        </div>
      )}

      {/* Canceled Message */}
      {canceled && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <AlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-800 dark:text-gray-300">Plaćanje je otkazano.</span>
        </div>
      )}

      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Crown className="h-5 w-5" />
            Trenutni status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status.isInTrial ? (
            <div className="space-y-1">
              <p className="text-base font-semibold text-green-600 dark:text-green-400">
                Probni period aktivan
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Imate još <strong>{status.trialDaysRemaining}</strong> dana besplatnog pristupa.
              </p>
            </div>
          ) : status.status === "ACTIVE" ? (
            <div className="space-y-1">
              <p className="text-base font-semibold text-green-600 dark:text-green-400">
                Aktivna pretplata
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.billingInterval === "YEAR" ? "Godišnja" : "Mesečna"} pretplata
                {status.cancelAtPeriodEnd && " (otkazana, aktivna do kraja perioda)"}
              </p>
              {status.currentPeriodEnd && (
                <p className="text-xs text-gray-500">
                  Sledeća naplata:{" "}
                  {new Date(status.currentPeriodEnd).toLocaleDateString("sr-RS", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-base font-semibold text-red-600 dark:text-red-400">
                {status.status === "PAST_DUE" ? "Plaćanje neuspešno" : "Pretplata istekla"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {status.status === "PAST_DUE"
                  ? "Ažurirajte način plaćanja da biste nastavili da koristite Zakazi Termin."
                  : "Pretplatite se da biste nastavili da koristite Zakazi Termin."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Options - Show when trial (without paid subscription), expired, or no subscription */}
      {((!status.hasPaidSubscription && status.isInTrial) ||
        status.status === "EXPIRED" ||
        !status.hasSubscription) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Izaberite plan</CardTitle>
            <CardDescription className="text-sm">
              Odaberite mesečnu ili godišnju pretplatu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Monthly */}
              <button
                type="button"
                onClick={() => setSelectedInterval("monthly")}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  selectedInterval === "monthly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-semibold text-foreground">Mesečna</p>
                <p className="text-2xl font-bold text-foreground">
                  {PRICES.monthly.amount}{" "}
                  <span className="text-sm font-normal text-muted-foreground">RSD/mes</span>
                </p>
              </button>

              {/* Yearly */}
              <button
                type="button"
                onClick={() => setSelectedInterval("yearly")}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                  selectedInterval === "yearly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="absolute -top-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                  {PRICES.yearly.savings}
                </span>
                <p className="font-semibold text-foreground">Godišnja</p>
                <p className="text-2xl font-bold text-foreground">
                  {PRICES.yearly.amount}{" "}
                  <span className="text-sm font-normal text-muted-foreground">RSD/god</span>
                </p>
              </button>
            </div>

            <Button
              onClick={() => createCheckout.mutate({ interval: selectedInterval })}
              disabled={createCheckout.isPending}
              className="w-full"
              size="lg"
            >
              {createCheckout.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              {createCheckout.isPending ? "Preusmeravanje..." : "Pretplati se"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manage Subscription - Show when user has a paid subscription */}
      {status.hasPaidSubscription && (status.status === "ACTIVE" || status.isInTrial) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upravljanje pretplatom</CardTitle>
            <CardDescription className="text-sm">
              Promenite način plaćanja ili otkažite pretplatu
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
            >
              {createPortal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createPortal.isPending ? "Učitavanje..." : "Upravljaj načinom plaćanja"}
            </Button>

            {status.cancelAtPeriodEnd ? (
              <Button
                variant="outline"
                onClick={() => resumeSubscription.mutate()}
                disabled={resumeSubscription.isPending}
              >
                {resumeSubscription.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {resumeSubscription.isPending ? "Učitavanje..." : "Nastavi pretplatu"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Da li ste sigurni da želite da otkažete pretplatu?")) {
                    cancelSubscription.mutate();
                  }
                }}
                disabled={cancelSubscription.isPending}
              >
                {cancelSubscription.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {cancelSubscription.isPending ? "Učitavanje..." : "Otkaži pretplatu"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Past Due - Show manage payment */}
      {status.status === "PAST_DUE" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ažurirajte način plaćanja</CardTitle>
            <CardDescription className="text-sm">
              Vaše plaćanje nije uspelo. Ažurirajte karticu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => createPortal.mutate()}
              disabled={createPortal.isPending}
            >
              {createPortal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createPortal.isPending ? "Učitavanje..." : "Ažuriraj način plaćanja"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Istorija plaćanja
          </CardTitle>
          <CardDescription className="text-sm">
            Pregled svih vaših faktura i plaćanja
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !invoicesData?.invoices.length ? (
            <div className="py-8 text-center text-muted-foreground">
              Nemate još nijednu fakturu.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="pb-3 font-medium">Datum</th>
                      <th className="pb-3 font-medium">Broj fakture</th>
                      <th className="pb-3 font-medium">Iznos</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoicesData.invoices.map((invoice) => (
                      <tr key={invoice.id} className="text-sm">
                        <td className="py-3">
                          {new Date(invoice.created * 1000).toLocaleDateString("sr-RS", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 font-mono text-muted-foreground">
                          {invoice.number || "-"}
                        </td>
                        <td className="py-3 font-medium">
                          {(invoice.amountPaid / 100).toLocaleString("sr-RS")} RSD
                        </td>
                        <td className="py-3">
                          <InvoiceStatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            {invoice.hostedInvoiceUrl && (
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Pogledaj fakturu"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Pogledaj
                              </a>
                            )}
                            {invoice.invoicePdf && (
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Preuzmi PDF"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-3 sm:hidden">
                {invoicesData.invoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-lg border bg-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {(invoice.amountPaid / 100).toLocaleString("sr-RS")} RSD
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.created * 1000).toLocaleDateString("sr-RS", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {invoice.number || "-"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      {invoice.hostedInvoiceUrl && (
                        <a
                          href={invoice.hostedInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Pogledaj
                        </a>
                      )}
                      {invoice.invoicePdf && (
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: string | null }) {
  switch (status) {
    case "paid":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          <Check className="h-3 w-3" />
          Plaćeno
        </span>
      );
    case "open":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Na čekanju
        </span>
      );
    case "draft":
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Nacrt
        </span>
      );
    case "uncollectible":
    case "void":
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Neuspelo
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {status || "-"}
        </span>
      );
  }
}
