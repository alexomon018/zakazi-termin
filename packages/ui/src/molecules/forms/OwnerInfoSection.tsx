"use client";

import { Button, Input, PhoneInput } from "@salonko/ui";
import { Lock, Mail, Phone, User } from "lucide-react";
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

interface OwnerInfoSectionProps {
  control: Control<SignupFormData>;
  errors: FieldErrors<SignupFormData>;
  isLoading: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  register: UseFormRegister<SignupFormData>;
}

export function OwnerInfoSection({
  control,
  errors,
  isLoading,
  isExpanded,
  onToggle,
  register,
}: OwnerInfoSectionProps) {
  return (
    <SignupFormSection
      icon={<User className="w-4 h-4" />}
      title="Vas nalog"
      isExpanded={isExpanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <SignupFormField label="Ime" error={errors.ownerFirstName?.message}>
            <Input
              id="ownerFirstName"
              data-testid="signup-first-name-input"
              type="text"
              placeholder="Ana"
              disabled={isLoading}
              {...register("ownerFirstName")}
            />
          </SignupFormField>

          <SignupFormField label="Prezime" error={errors.ownerLastName?.message}>
            <Input
              id="ownerLastName"
              data-testid="signup-last-name-input"
              type="text"
              placeholder="Petrovic"
              disabled={isLoading}
              {...register("ownerLastName")}
            />
          </SignupFormField>
        </div>

        <SignupFormField
          label="Email za prijavu"
          error={errors.email?.message}
          icon={<Mail className="w-4 h-4" />}
        >
          <Input
            id="email"
            data-testid="signup-email-input"
            type="email"
            placeholder="ana@email.com"
            disabled={isLoading}
            className="pl-10"
            {...register("email")}
          />
        </SignupFormField>

        <SignupFormField
          label="Vas telefon"
          error={errors.ownerPhone?.message}
          icon={<Phone className="w-4 h-4" />}
        >
          <Controller
            name="ownerPhone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="ownerPhone"
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
          label="Lozinka"
          error={errors.password?.message}
          icon={<Lock className="w-4 h-4" />}
        >
          <Input
            id="password"
            data-testid="signup-password-input"
            type="password"
            placeholder="Najmanje 8 karaktera"
            disabled={isLoading}
            className="pl-10"
            {...register("password")}
          />
        </SignupFormField>

        <SignupFormField
          label="Potvrdi lozinku"
          error={errors.confirmPassword?.message}
          icon={<Lock className="w-4 h-4" />}
        >
          <Input
            id="confirmPassword"
            data-testid="signup-confirm-password-input"
            type="password"
            placeholder="Ponovite lozinku"
            disabled={isLoading}
            className="pl-10"
            {...register("confirmPassword")}
          />
        </SignupFormField>
      </div>
    </SignupFormSection>
  );
}
