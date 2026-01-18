"use client";

import { MapPin, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../atoms/Button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../atoms/Command";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../atoms/Dialog";
import { ScrollArea } from "../../atoms/ScrollArea";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  city?: string;
  streetAddress?: string;
  phone?: string;
  website?: string;
  openingHours?: {
    day: number;
    open: string;
    close: string;
  }[];
}

interface GooglePlacesSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  apiKey: string;
  disabled?: boolean;
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export function GooglePlacesSearch({ onPlaceSelect, apiKey, disabled }: GooglePlacesSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const mapDiv = useRef<HTMLDivElement | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!apiKey) return;

    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      initializeServices();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=sr`;
    script.async = true;
    script.defer = true;
    script.onload = initializeServices;
    document.head.appendChild(script);

    return () => {
      // Don't remove script as it might be needed elsewhere
    };
  }, [apiKey]);

  const initializeServices = useCallback(() => {
    if (typeof google === "undefined" || !google.maps?.places) return;

    autocompleteService.current = new google.maps.places.AutocompleteService();
    sessionToken.current = new google.maps.places.AutocompleteSessionToken();

    // Create hidden div for PlacesService
    if (!mapDiv.current) {
      mapDiv.current = document.createElement("div");
      mapDiv.current.style.display = "none";
      document.body.appendChild(mapDiv.current);
    }

    const map = new google.maps.Map(mapDiv.current, {
      center: { lat: 44.8, lng: 20.4 },
      zoom: 8,
    });
    placesService.current = new google.maps.places.PlacesService(map);
  }, []);

  const searchPlaces = useCallback(async (input: string) => {
    if (!input || input.length < 2 || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        sessionToken: sessionToken.current!,
        types: ["establishment"],
        componentRestrictions: { country: "rs" },
      };

      autocompleteService.current.getPlacePredictions(request, (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results as PlacePrediction[]);
        } else {
          setPredictions([]);
        }
      });
    } catch {
      setIsLoading(false);
      setPredictions([]);
    }
  }, []);

  const getPlaceDetails = useCallback(
    (placeId: string) => {
      if (!placesService.current) return;

      setIsLoading(true);

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          "name",
          "formatted_address",
          "address_components",
          "international_phone_number",
          "website",
          "opening_hours",
        ],
        sessionToken: sessionToken.current!,
      };

      placesService.current.getDetails(request, (place, status) => {
        setIsLoading(false);

        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          // Extract city and street from address components
          let city = "";
          let streetAddress = "";
          const addressComponents = place.address_components || [];

          for (const component of addressComponents) {
            if (component.types.includes("locality")) {
              city = component.long_name;
            }
            if (component.types.includes("route")) {
              streetAddress = component.long_name;
            }
            if (component.types.includes("street_number") && streetAddress) {
              streetAddress += ` ${component.long_name}`;
            } else if (component.types.includes("street_number") && !streetAddress) {
              streetAddress = component.long_name;
            }
          }

          // Parse opening hours
          let openingHours:
            | {
                day: number;
                open: string;
                close: string;
              }[]
            | undefined;

          if (place.opening_hours?.periods) {
            openingHours = place.opening_hours.periods
              .filter((period) => period.open && period.close)
              .map((period) => ({
                day: period.open!.day,
                open: `${String(period.open!.hours).padStart(2, "0")}:${String(period.open!.minutes).padStart(2, "0")}`,
                close: `${String(period.close!.hours).padStart(2, "0")}:${String(period.close!.minutes).padStart(2, "0")}`,
              }));
          }

          // Convert international phone number to E.164 format
          // international_phone_number is like "+381 63 265445", E.164 needs "+381632654455"
          const phoneE164 = place.international_phone_number
            ? place.international_phone_number.replace(/[\s-()]/g, "")
            : undefined;

          const result: PlaceResult = {
            placeId,
            name: place.name || "",
            address: place.formatted_address || "",
            city,
            streetAddress,
            phone: phoneE164,
            website: place.website,
            openingHours,
          };

          onPlaceSelect(result);
          setOpen(false);
          setSearchValue("");
          setPredictions([]);

          // Reset session token after selection
          sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }
      });
    },
    [onPlaceSelect]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchPlaces]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !apiKey}
          className="gap-2 justify-center py-6 w-full text-base"
        >
          <Search className="w-5 h-5" />
          Pretrazi salon na Google-u
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pronadi svoj salon</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Unesi naziv salona..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <ScrollArea className="h-72">
              {searchValue.length < 2 ? (
                <div className="py-6 text-sm text-center text-muted-foreground">
                  <div className="p-4 rounded-lg border-2 border-dashed border-muted">
                    Upisi bar 2 slova da bi se pojavili rezultati.
                  </div>
                </div>
              ) : isLoading ? (
                <div className="py-6 text-sm text-center text-muted-foreground">Pretraga...</div>
              ) : predictions.length === 0 ? (
                <CommandEmpty>Salon nije pronadjen.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {predictions.map((prediction) => (
                    <CommandItem
                      key={prediction.place_id}
                      value={prediction.place_id}
                      onSelect={() => getPlaceDetails(prediction.place_id)}
                      className="flex gap-2 items-start py-3"
                    >
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {prediction.structured_formatting.main_text}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {prediction.structured_formatting.secondary_text}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
