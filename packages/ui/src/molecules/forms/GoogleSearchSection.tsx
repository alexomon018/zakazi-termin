"use client";

import { Search } from "lucide-react";
import { GooglePlacesSearch, type PlaceResult } from "../google-places/GooglePlacesSearch";
import { SignupFormSection } from "./SignupFormSection";

interface GoogleSearchSectionProps {
  apiKey: string;
  isExpanded: boolean;
  isLoading: boolean;
  onPlaceSelect: (place: PlaceResult) => void;
  onToggle: () => void;
  onManualFill: () => void;
}

export function GoogleSearchSection({
  apiKey,
  isExpanded,
  isLoading,
  onPlaceSelect,
  onToggle,
  onManualFill,
}: GoogleSearchSectionProps) {
  return (
    <SignupFormSection
      icon={<Search className="w-4 h-4" />}
      title="Pronadji salon"
      badge="Brza registracija"
      badgeVariant="primary"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
        Pronadji svoj salon na Google Maps i automatski popuni podatke
      </p>
      <GooglePlacesSearch apiKey={apiKey} onPlaceSelect={onPlaceSelect} disabled={isLoading} />
      <button
        type="button"
        onClick={onManualFill}
        className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
      >
        ili popuni rucno
      </button>
    </SignupFormSection>
  );
}
