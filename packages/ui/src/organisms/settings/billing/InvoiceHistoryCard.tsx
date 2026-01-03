import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";

import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import type { Invoice } from "./types";

type InvoiceHistoryCardProps = {
  invoices: Invoice[] | undefined;
  isLoading: boolean;
};

export function InvoiceHistoryCard({ invoices, isLoading }: InvoiceHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-lg">
          <FileText className="w-5 h-5" />
          Istorija plaćanja
        </CardTitle>
        <CardDescription className="text-sm">Pregled svih vaših faktura i plaćanja</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !invoices?.length ? (
          <div className="py-8 text-center text-muted-foreground">Nemate još nijednu fakturu.</div>
        ) : (
          <>
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="text-sm text-left border-b text-muted-foreground">
                    <th className="pb-3 font-medium">Datum</th>
                    <th className="pb-3 font-medium">Broj fakture</th>
                    <th className="pb-3 font-medium">Iznos</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Akcije</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map((invoice) => (
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
                        <div className="flex gap-2 justify-end items-center">
                          {invoice.hostedInvoiceUrl && (
                            <a
                              href={invoice.hostedInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex gap-1 items-center px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
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
                              className="inline-flex gap-1 items-center px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
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

            <div className="space-y-3 sm:hidden">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex justify-between items-start">
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
                  <div className="flex gap-2 mt-3">
                    {invoice.hostedInvoiceUrl && (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
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
                        <Download className="w-4 h-4" />
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
  );
}
