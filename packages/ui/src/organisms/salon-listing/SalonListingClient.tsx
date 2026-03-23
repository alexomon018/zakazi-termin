"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Button,
  Card,
  CardContent,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@salonko/ui";
import { useDebounce } from "@salonko/ui/hooks/useDebounce";
import { SearchX } from "lucide-react";
import { useState } from "react";
import { SalonCard } from "../../molecules/landing/SalonCard";
import { SalonSearchInput } from "../../molecules/landing/SalonSearchInput";
import { SalonTypeFilter } from "../../molecules/landing/SalonTypeFilter";

const PAGE_SIZE = 12;

export function SalonListingClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: cities } = trpc.salon.cities.useQuery();

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
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
  const hasResults = salons.length > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Svi saloni</h1>
        <p className="mt-2 text-muted-foreground">
          Pronađite savršeni salon i zakažite termin online
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SalonSearchInput value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Filters row */}
      <div className="space-y-4 mb-8">
        {/* Type filter */}
        <SalonTypeFilter selected={selectedType} onChange={setSelectedType} />

        {/* City + open now */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* City filter */}
          <Select
            value={selectedCity ?? "all"}
            onValueChange={(value) => setSelectedCity(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Svi gradovi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Svi gradovi</SelectItem>
              {cities?.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Open now toggle */}
          <div className="flex items-center gap-2">
            <Switch id="open-now" checked={openNow} onCheckedChange={setOpenNow} />
            <Label htmlFor="open-now" className="text-sm cursor-pointer">
              Otvoreno sada
            </Label>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((key) => (
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {salons.map((salon) => (
              <SalonCard key={salon.id} {...salon} />
            ))}
          </div>

          {/* Load more */}
          {hasNextPage && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Učitavanje..." : "Učitaj još"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <SearchX className="w-12 h-12 mx-auto mb-4 text-primary/30 dark:text-primary/40" />
            <p className="text-muted-foreground">
              {debouncedQuery || selectedType || selectedCity || openNow
                ? "Nema salona koji odgovaraju vašoj pretrazi. Pokušajte sa drugim filterima."
                : "Trenutno nema dostupnih salona."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
