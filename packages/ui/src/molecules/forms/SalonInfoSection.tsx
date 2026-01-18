"use client";

import { SALON_TYPES } from "@salonko/config";
import {
  Button,
  Checkbox,
  Input,
  Label,
  PhoneInput,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from "@salonko/ui";
import { Building2, ChevronDown, ChevronUp, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { type Control, Controller, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { SignupFormField } from "./SignupFormField";
import { SignupFormSection } from "./SignupFormSection";

interface SignupFormData {
  salonName: string;
  salonTypes: string[];
  salonPhone: string;
  salonEmail?: string;
  salonCity: string;
  salonAddress: string;
  googlePlaceId?: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  ownerPhone: string;
  password: string;
  confirmPassword: string;
}

interface SalonInfoSectionProps {
  control: Control<SignupFormData>;
  errors: FieldErrors<SignupFormData>;
  isLoading: boolean;
  isExpanded: boolean;
  salonName?: string;
  selectedSalonTypes: string[];
  salonTypePopoverOpen: boolean;
  onToggle: () => void;
  onSalonTypeToggle: (typeId: string) => void;
  onSetSalonTypePopoverOpen: (open: boolean) => void;
  onContinue: () => void;
  register: UseFormRegister<SignupFormData>;
}

function getSelectedTypesLabel(selectedSalonTypes: string[]) {
  if (!selectedSalonTypes || selectedSalonTypes.length === 0) {
    return "Izaberite tip salona";
  }
  const labels = selectedSalonTypes
    .map((id) => SALON_TYPES.find((t) => t.id === id)?.label)
    .filter(Boolean);
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

export function SalonInfoSection({
  control,
  errors,
  isLoading,
  isExpanded,
  salonName,
  selectedSalonTypes,
  salonTypePopoverOpen,
  onToggle,
  onSalonTypeToggle,
  onSetSalonTypePopoverOpen,
  onContinue,
  register,
}: SalonInfoSectionProps) {
  return (
    <SignupFormSection
      icon={<Building2 className="w-4 h-4" />}
      title="Podaci o salonu"
      badge={salonName ? "Popunjeno" : undefined}
      badgeVariant="success"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <SignupFormField
          label="Naziv salona"
          error={errors.salonName?.message}
          icon={<Sparkles className="w-4 h-4" />}
        >
          <Input
            id="salonName"
            data-testid="signup-salon-name-input"
            type="text"
            placeholder="npr. Studio Lepote Ana"
            disabled={isLoading}
            className="pl-10"
            {...register("salonName")}
          />
        </SignupFormField>

        <div>
          <Label
            id="salon-types-label"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
          >
            Tip salona
          </Label>
          <Popover open={salonTypePopoverOpen} onOpenChange={onSetSalonTypePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                id="salon-types-trigger"
                type="button"
                variant="outline"
                className="w-full justify-between font-normal h-11 text-left"
                disabled={isLoading}
                aria-labelledby="salon-types-label salon-types-trigger"
              >
                <span className="truncate text-gray-600 dark:text-gray-400">
                  {getSelectedTypesLabel(selectedSalonTypes)}
                </span>
                {salonTypePopoverOpen ? (
                  <ChevronUp className="w-4 h-4 opacity-50 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
              <ScrollArea className="h-64">
                <div className="p-2">
                  {SALON_TYPES.map((type) => (
                    <label
                      key={type.id}
                      htmlFor={`salon-type-${type.id}`}
                      className="flex items-center px-3 py-2.5 space-x-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <Checkbox
                        id={`salon-type-${type.id}`}
                        checked={selectedSalonTypes?.includes(type.id)}
                        onCheckedChange={() => onSalonTypeToggle(type.id)}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-2 border-t dark:border-gray-700">
                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={() => onSetSalonTypePopoverOpen(false)}
                >
                  Potvrdi ({selectedSalonTypes?.length || 0})
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {errors.salonTypes && (
            <p className="mt-1.5 text-sm text-red-500">{errors.salonTypes.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SignupFormField
            label="Grad"
            error={errors.salonCity?.message}
            icon={<MapPin className="w-4 h-4" />}
          >
            <Input
              id="salonCity"
              type="text"
              placeholder="Beograd"
              disabled={isLoading}
              className="pl-10"
              {...register("salonCity")}
            />
          </SignupFormField>

          <SignupFormField label="Adresa" error={errors.salonAddress?.message}>
            <Input
              id="salonAddress"
              type="text"
              placeholder="Ulica i broj"
              disabled={isLoading}
              {...register("salonAddress")}
            />
          </SignupFormField>
        </div>

        <SignupFormField
          label="Telefon salona"
          error={errors.salonPhone?.message}
          icon={<Phone className="w-4 h-4" />}
        >
          <Controller
            name="salonPhone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="salonPhone"
                defaultCountry="RS"
                placeholder="+381 XX XXX XXXX"
                disabled={isLoading}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </SignupFormField>

        <SignupFormField
          label="Email salona"
          error={errors.salonEmail?.message}
          optional
          icon={<Mail className="w-4 h-4" />}
        >
          <Input
            id="salonEmail"
            type="email"
            placeholder="kontakt@mojsalon.rs"
            disabled={isLoading}
            className="pl-10"
            {...register("salonEmail")}
          />
        </SignupFormField>

        <Button type="button" variant="outline" className="w-full" onClick={onContinue}>
          Nastavi
        </Button>
      </div>
    </SignupFormSection>
  );
}
