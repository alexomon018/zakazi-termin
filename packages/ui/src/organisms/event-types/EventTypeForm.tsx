"use client";

import { Calendar, Clock, Eye, EyeOff, MapPin, Settings } from "lucide-react";
import type { FormEvent } from "react";
import { Button } from "../../atoms/Button";
import { Card, CardContent } from "../../atoms/Card";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Switch } from "../../atoms/Switch";
import { DurationSelector } from "../../molecules/forms/DurationSelector";
import { FormSection } from "../../molecules/forms/FormSection";
import { SelectField, type SelectOption } from "../../molecules/forms/SelectField";

export type LocationType = "inPerson" | "phone" | "link";

export interface Location {
  type: LocationType;
  address?: string;
  phone?: string;
  link?: string;
}

export type Schedule = {
  id: string;
  name: string;
};

export type EventTypeFormData = {
  title: string;
  slug: string;
  description: string;
  length: number;
  hidden: boolean;
  locationType: LocationType;
  locationAddress: string;
  minimumBookingNotice: number;
  beforeEventBuffer: number;
  afterEventBuffer: number;
  slotInterval: number | null;
  requiresConfirmation: boolean;
  scheduleId: string | null;
};

export const DEFAULT_FORM_DATA: EventTypeFormData = {
  title: "",
  slug: "",
  description: "",
  length: 30,
  hidden: false,
  locationType: "inPerson",
  locationAddress: "",
  minimumBookingNotice: 120,
  beforeEventBuffer: 0,
  afterEventBuffer: 0,
  slotInterval: null,
  requiresConfirmation: false,
  scheduleId: null,
};

export const NOTICE_OPTIONS: SelectOption[] = [
  { value: "0", label: "Bez ograničenja" },
  { value: "60", label: "1 sat" },
  { value: "120", label: "2 sata" },
  { value: "240", label: "4 sata" },
  { value: "480", label: "8 sati" },
  { value: "1440", label: "1 dan" },
  { value: "2880", label: "2 dana" },
  { value: "10080", label: "1 nedelja" },
];

export const BUFFER_OPTIONS: SelectOption[] = [
  { value: "0", label: "Bez pauze" },
  { value: "5", label: "5 min" },
  { value: "10", label: "10 min" },
  { value: "15", label: "15 min" },
  { value: "30", label: "30 min" },
  { value: "60", label: "1 sat" },
];

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/[ž]/g, "z")
    .replace(/[đ]/g, "dj")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function validateEventTypeForm(formData: EventTypeFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!formData.title.trim()) errors.title = "Naziv je obavezan";
  if (!formData.slug.trim()) errors.slug = "Slug je obavezan";
  if (formData.length < 5) errors.length = "Trajanje mora biti najmanje 5 minuta";
  if (formData.locationType === "inPerson" && !formData.locationAddress.trim()) {
    errors.locationAddress = "Adresa je obavezna za termine uživo";
  }
  return errors;
}

export function buildLocationsArray(formData: EventTypeFormData): Location[] {
  const locations: Location[] = [];
  if (formData.locationType === "inPerson" && formData.locationAddress) {
    locations.push({ type: "inPerson", address: formData.locationAddress });
  }
  return locations;
}

type EventTypeFormProps = {
  formData: EventTypeFormData;
  errors: Record<string, string>;
  schedules: Schedule[];
  isPending: boolean;
  submitLabel: string;
  pendingLabel: string;
  showVisibilityToggle?: boolean;
  onFormDataChange: (updater: (prev: EventTypeFormData) => EventTypeFormData) => void;
  onSubmit: (e: FormEvent) => void;
  onTitleChange?: (title: string) => void;
  onSlugChange?: (slug: string) => void;
  testIdPrefix?: string;
};

export function EventTypeForm({
  formData,
  errors,
  schedules,
  isPending,
  submitLabel,
  pendingLabel,
  showVisibilityToggle = false,
  onFormDataChange,
  onSubmit,
  onTitleChange,
  onSlugChange,
  testIdPrefix = "event-type",
}: EventTypeFormProps) {
  const handleTitleChange = (title: string) => {
    if (onTitleChange) {
      onTitleChange(title);
    } else {
      onFormDataChange((prev) => ({ ...prev, title }));
    }
  };

  const handleSlugChange = (slug: string) => {
    if (onSlugChange) {
      onSlugChange(slug);
    } else {
      onFormDataChange((prev) => ({ ...prev, slug }));
    }
  };

  const scheduleOptions: SelectOption[] = [
    { value: "default", label: "Podrazumevani raspored" },
    ...schedules.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {errors.form && (
        <div
          data-testid={`${testIdPrefix}-error-message`}
          className="p-4 text-red-700 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400"
        >
          {errors.form}
        </div>
      )}

      {/* Visibility toggle */}
      {showVisibilityToggle && (
        <Card>
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-3 items-center">
                {formData.hidden ? (
                  <EyeOff className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-green-500" />
                )}
                <div>
                  <Label className="text-base text-gray-900 dark:text-white">Vidljivost</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formData.hidden
                      ? "Ovaj tip termina je skriven i klijenti ga ne mogu videti"
                      : "Ovaj tip termina je aktivan i vidljiv klijentima"}
                  </p>
                </div>
              </div>
              <Switch
                checked={!formData.hidden}
                onCheckedChange={(checked) =>
                  onFormDataChange((prev) => ({ ...prev, hidden: !checked }))
                }
                activeColor="green"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <FormSection icon={Clock} title="Osnovne informacije">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-900 dark:text-white">
              Naziv
            </Label>
            <Input
              id="title"
              data-testid={`${testIdPrefix}-title-input`}
              placeholder="npr. Konsultacija"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-gray-900 dark:text-white">
              URL slug
            </Label>
            <div className="flex items-center">
              <span className="mr-1 text-sm text-gray-500 dark:text-gray-400">/</span>
              <Input
                id="slug"
                data-testid={`${testIdPrefix}-slug-input`}
                placeholder="konsultacija"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={errors.slug ? "border-red-500" : ""}
              />
            </div>
            {errors.slug && (
              <p data-testid={`${testIdPrefix}-slug-error`} className="text-sm text-red-500">
                {errors.slug}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-gray-900 dark:text-white">
            Opis (opciono)
          </Label>
          <textarea
            id="description"
            data-testid={`${testIdPrefix}-description-input`}
            rows={3}
            placeholder="Opišite šta klijent može očekivati od ovog termina..."
            value={formData.description}
            onChange={(e) =>
              onFormDataChange((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="px-3 py-2 w-full text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <DurationSelector
          value={formData.length}
          onChange={(length) => onFormDataChange((prev) => ({ ...prev, length }))}
          error={errors.length}
          testIdPrefix={testIdPrefix}
        />
      </FormSection>

      {/* Location */}
      <FormSection icon={MapPin} title="Lokacija">
        <div className="space-y-2">
          <Label htmlFor="locationAddress" className="text-gray-900 dark:text-white">
            Adresa
          </Label>
          <Input
            id="locationAddress"
            data-testid={`${testIdPrefix}-location-address-input`}
            placeholder="npr. Knez Mihailova 10, Beograd"
            value={formData.locationAddress}
            onChange={(e) =>
              onFormDataChange((prev) => ({
                ...prev,
                locationAddress: e.target.value,
              }))
            }
            className={errors.locationAddress ? "border-red-500" : ""}
          />
          {errors.locationAddress && (
            <p className="text-sm text-red-500">{errors.locationAddress}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ova adresa će biti prikazana klijentima prilikom zakazivanja
          </p>
        </div>
      </FormSection>

      {/* Schedule */}
      <FormSection icon={Calendar} title="Raspored">
        <SelectField
          label="Koristi raspored"
          value={formData.scheduleId || "default"}
          onValueChange={(value) =>
            onFormDataChange((prev) => ({
              ...prev,
              scheduleId: value === "default" ? null : value,
            }))
          }
          options={scheduleOptions}
          placeholder="Podrazumevani raspored"
          helperText="Izaberite koji raspored radnog vremena da koristite za ovaj tip termina"
        />
      </FormSection>

      {/* Advanced Settings */}
      <FormSection icon={Settings} title="Napredna podešavanja" contentClassName="space-y-6">
        <SelectField
          label="Minimalno vreme unapred za zakazivanje"
          value={formData.minimumBookingNotice.toString()}
          onValueChange={(value) =>
            onFormDataChange((prev) => ({
              ...prev,
              minimumBookingNotice: Number.parseInt(value),
            }))
          }
          options={NOTICE_OPTIONS}
          helperText="Koliko ranije klijent mora zakazati termin"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            label="Pauza pre termina"
            value={formData.beforeEventBuffer.toString()}
            onValueChange={(value) =>
              onFormDataChange((prev) => ({
                ...prev,
                beforeEventBuffer: Number.parseInt(value),
              }))
            }
            options={BUFFER_OPTIONS}
          />
          <SelectField
            label="Pauza posle termina"
            value={formData.afterEventBuffer.toString()}
            onValueChange={(value) =>
              onFormDataChange((prev) => ({
                ...prev,
                afterEventBuffer: Number.parseInt(value),
              }))
            }
            options={BUFFER_OPTIONS}
          />
        </div>

        <div className="flex justify-between items-center">
          <div>
            <Label className="text-gray-900 dark:text-white">Zahtevaj ručnu potvrdu</Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Termini neće biti automatski potvrđeni dok ih ne odobrite
            </p>
          </div>
          <Switch
            checked={formData.requiresConfirmation}
            onCheckedChange={(checked) =>
              onFormDataChange((prev) => ({
                ...prev,
                requiresConfirmation: checked,
              }))
            }
          />
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex gap-4 justify-end items-center">
        <Button type="submit" data-testid={`${testIdPrefix}-submit-button`} disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
