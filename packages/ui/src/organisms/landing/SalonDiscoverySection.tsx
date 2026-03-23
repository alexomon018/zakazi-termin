"use client";

import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@salonko/ui";
import { useDebounce } from "@salonko/ui/hooks/useDebounce";
import { cn } from "@salonko/ui/utils";
import { ArrowRight, SearchX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SalonCard } from "../../molecules/landing/SalonCard";
import { SalonSearchInput } from "../../molecules/landing/SalonSearchInput";
import { SalonTypeFilter } from "../../molecules/landing/SalonTypeFilter";

export function SalonDiscoverySection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data, isLoading } = trpc.salon.search.useQuery({
    query: debouncedQuery || undefined,
    salonType: selectedType ?? undefined,
    limit: 8,
  });

  const salons = data?.items ?? [];
  const hasResults = salons.length > 0;

  return (
    <section id="pronadji-salon" className="py-16 sm:py-20 bg-gray-50/50 dark:bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pronađite savršeni salon
          </h2>
          <p className="mt-2 text-muted-foreground text-base sm:text-lg">
            Pretražite salone i zakažite termin u samo par klikova
          </p>
        </div>

        {/* Search input */}
        <div className="max-w-2xl mx-auto mb-6">
          <SalonSearchInput value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Type filters */}
        <div className="mb-8">
          <SalonTypeFilter selected={selectedType} onChange={setSelectedType} />
        </div>

        {/* Salon grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["a", "b", "c", "d"].map((key) => (
              <Card key={key}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                  <div className="flex gap-1.5 mb-3">
                    <div className="h-5 bg-muted rounded-full animate-pulse w-20" />
                    <div className="h-5 bg-muted rounded-full animate-pulse w-16" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded animate-pulse w-16" />
                    <div className="h-4 bg-muted rounded animate-pulse w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hasResults ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {salons.map((salon) => (
              <SalonCard key={salon.id} {...salon} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <SearchX className="w-12 h-12 mx-auto mb-4 text-primary/30 dark:text-primary/40" />
              <p className="text-muted-foreground">
                {debouncedQuery || selectedType
                  ? "Nema salona koji odgovaraju vašoj pretrazi. Pokušajte sa drugim filterima."
                  : "Trenutno nema dostupnih salona."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* "See all" link */}
        {hasResults && (
          <div className="mt-8 text-center">
            <Link
              href="/saloni"
              className={cn(
                "inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4 transition-colors"
              )}
            >
              Pogledajte sve salone
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
