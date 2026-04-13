"use client";

import { trpc } from "@/lib/trpc/client";
import { SalonListingClient } from "@salonko/ui";
import { useDebounce } from "@salonko/ui/hooks/useDebounce";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PAGE_SIZE = 12;

export function SalonListingClientContainer() {
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") ?? "");
  const [selectedType, setSelectedType] = useState<string | null>(() => searchParams.get("type"));
  const [selectedCity, setSelectedCity] = useState<string | null>(() => searchParams.get("city"));
  const [openNow, setOpenNow] = useState(() => searchParams.get("openNow") === "true");
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    setSearchQuery(searchParams.get("query") ?? "");
    setSelectedType(searchParams.get("type"));
    setSelectedCity(searchParams.get("city"));
    setOpenNow(searchParams.get("openNow") === "true");
  }, [searchParams]);

  const { data: cities } = trpc.salon.cities.useQuery();

  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.salon.search.useInfiniteQuery(
      {
        query: debouncedQuery || undefined,
        salonType: selectedType ?? undefined,
        city: selectedCity ?? undefined,
        openNow: openNow || undefined,
        limit: PAGE_SIZE,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

  const salons = data?.pages.flatMap((page) => page.items) ?? [];
  const isFiltered = Boolean(debouncedQuery || selectedType || selectedCity || openNow);

  return (
    <SalonListingClient
      salons={salons}
      isLoading={isLoading}
      error={error?.message}
      searchQuery={searchQuery}
      selectedType={selectedType}
      selectedCity={selectedCity}
      openNow={openNow}
      cities={cities ?? []}
      hasNextPage={hasNextPage ?? false}
      isFetchingNextPage={isFetchingNextPage}
      isFiltered={isFiltered}
      onSearchChange={setSearchQuery}
      onTypeChange={setSelectedType}
      onCityChange={setSelectedCity}
      onOpenNowChange={setOpenNow}
      onFetchNextPage={fetchNextPage}
    />
  );
}
