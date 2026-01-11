"use client";

import { Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from "@salonko/ui";
import { AlertCircle, Check, ExternalLink } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { ProfileFormValues } from "./ProfileClient";

/**
 * Regex pattern for valid salon name slugs.
 * Must contain only lowercase letters, numbers, and hyphens.
 */
const VALID_SLUG_PATTERN = /^[a-z0-9-]*$/;

/**
 * Validates and sanitizes a salon name slug for safe URL usage.
 * Returns the slug if valid, or an empty string if invalid.
 */
function getSafeSlug(slug: string): string {
  if (!slug || !VALID_SLUG_PATTERN.test(slug)) {
    return "";
  }
  return slug;
}

type BasicInfoCardProps = {
  register: UseFormRegister<ProfileFormValues>;
  errors: FieldErrors<ProfileFormValues>;
  /**
   * Pre-validated salon name slug. Must match pattern /^[a-z0-9-]*$/.
   * This value is used directly in href construction, so it must be sanitized
   * before being passed to this component.
   */
  salonNameSlug: string;
  salonNameAvailable: boolean | null;
};

export function BasicInfoCard({
  register,
  errors,
  salonNameSlug,
  salonNameAvailable,
}: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Osnovne informacije</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-900 dark:text-white">
              Ime i prezime
            </Label>
            <Input id="name" {...register("name")} placeholder="Marko Marković" />
            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salonName" className="text-gray-900 dark:text-white">
              Naziv salona
            </Label>
            <div className="relative">
              <Input
                id="salonName"
                {...register("salonName")}
                placeholder="Moj Salon"
                className={
                  salonNameAvailable === false
                    ? "border-red-500 focus:ring-red-500"
                    : salonNameAvailable === true
                      ? "border-green-500 focus:ring-green-500"
                      : ""
                }
              />
              {salonNameAvailable !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {salonNameAvailable ? (
                    <>
                      <Check
                        className="w-4 h-4 text-green-500"
                        role="img"
                        aria-label="Naziv salona je dostupan"
                      />
                      <span className="sr-only">Naziv salona je dostupan</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle
                        className="w-4 h-4 text-red-500"
                        role="img"
                        aria-label="Naziv salona je zauzet"
                      />
                      <span className="sr-only">Naziv salona je zauzet</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {errors.salonName && <p className="text-sm text-red-600">{errors.salonName.message}</p>}
            {salonNameAvailable === false && (
              <p className="text-sm text-red-600">Naziv salona je već zauzet</p>
            )}
            <p className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
              Vaš link: {(() => {
                const safeSlug = getSafeSlug(salonNameSlug);
                return safeSlug ? (
                  <a
                    href={`/${safeSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex gap-1 items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    salonko.rs/{safeSlug}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span>salonko.rs/naziv-salona</span>
                );
              })()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="text-gray-900 dark:text-white">
            O salonu
          </Label>
          <Textarea
            id="bio"
            {...register("bio")}
            rows={3}
            className="text-gray-900 bg-white resize-none dark:bg-gray-800 dark:text-white"
            placeholder="Kratak opis o salonu koji će se prikazati na stranici za zakazivanje..."
          />
          {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
