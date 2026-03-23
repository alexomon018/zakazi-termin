"use client";

import { trpc } from "@/lib/trpc/client";
import { SalonDiscoverySection } from "@salonko/ui";
import { useDebounce } from "@salonko/ui/hooks/useDebounce";
import { useState } from "react";

export function SalonDiscoverySectionContainer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data, isLoading, error } = trpc.salon.search.useQuery({
    query: debouncedQuery || undefined,
    salonType: selectedType ?? undefined,
    limit: 8,
  });

  const salons = data?.items ?? [];

  const seeAllParams = new URLSearchParams();
  if (debouncedQuery) seeAllParams.set("query", debouncedQuery);
  if (selectedType) seeAllParams.set("type", selectedType);
  const seeAllHref = seeAllParams.toString() ? `/saloni?${seeAllParams.toString()}` : "/saloni";

  return (
    <SalonDiscoverySection
      salons={salons}
      isLoading={isLoading}
      error={error?.message}
      searchQuery={searchQuery}
      selectedType={selectedType}
      seeAllHref={seeAllHref}
      onSearchChange={setSearchQuery}
      onTypeChange={setSelectedType}
    />
  );
}
