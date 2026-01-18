"use client";

import { Button, GoogleIcon } from "@salonko/ui";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import type {
  Control,
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { GoogleSearchSection } from "../../molecules/forms/GoogleSearchSection";
import { OwnerInfoSection } from "../../molecules/forms/OwnerInfoSection";
import { SalonInfoSection } from "../../molecules/forms/SalonInfoSection";
import { SignupProgressSteps } from "../../molecules/forms/SignupProgressSteps";
import type { PlaceResult } from "../../molecules/google-places/GooglePlacesSearch";

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

interface SignupFormProps {
  control: Control<SignupFormData>;
  register: UseFormRegister<SignupFormData>;
  handleSubmit: UseFormHandleSubmit<SignupFormData>;
  watch: UseFormWatch<SignupFormData>;
  setValue: UseFormSetValue<SignupFormData>;
  errors: FieldErrors<SignupFormData>;
  isLoading: boolean;
  serverError: string | null;
  googlePlacesApiKey: string;
  onSubmit: (data: SignupFormData) => Promise<void>;
}

export function SignupForm({
  control,
  register,
  handleSubmit,
  watch,
  setValue,
  errors,
  isLoading,
  serverError,
  googlePlacesApiKey,
  onSubmit,
}: SignupFormProps) {
  const [activeSection, setActiveSection] = useState<"google" | "salon" | "owner">("google");
  const [salonTypePopoverOpen, setSalonTypePopoverOpen] = useState(false);

  const selectedSalonTypes = watch("salonTypes", []);
  const salonName = watch("salonName");

  const handlePlaceSelect = (place: PlaceResult) => {
    setValue("salonName", place.name.replace(/"/g, ""));
    if (place.city) setValue("salonCity", place.city);
    if (place.streetAddress) setValue("salonAddress", place.streetAddress);
    if (place.phone) setValue("salonPhone", place.phone);
    if (place.placeId) setValue("googlePlaceId", place.placeId);
    setActiveSection("salon");
  };

  const toggleSalonType = (typeId: string) => {
    const current = selectedSalonTypes || [];
    if (current.includes(typeId)) {
      setValue(
        "salonTypes",
        current.filter((id) => id !== typeId)
      );
    } else {
      setValue("salonTypes", [...current, typeId]);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      <SignupProgressSteps activeSection={activeSection} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div
            data-testid="signup-error-message"
            className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30 animate-scale-in"
          >
            {serverError}
          </div>
        )}

        <GoogleSearchSection
          apiKey={googlePlacesApiKey}
          isExpanded={activeSection === "google"}
          isLoading={isLoading}
          onPlaceSelect={handlePlaceSelect}
          onToggle={() => setActiveSection("google")}
          onManualFill={() => setActiveSection("salon")}
        />

        <SalonInfoSection
          control={control}
          errors={errors}
          isLoading={isLoading}
          isExpanded={activeSection === "salon"}
          salonName={salonName}
          selectedSalonTypes={selectedSalonTypes}
          salonTypePopoverOpen={salonTypePopoverOpen}
          onToggle={() => setActiveSection("salon")}
          onSalonTypeToggle={toggleSalonType}
          onSetSalonTypePopoverOpen={setSalonTypePopoverOpen}
          onContinue={() => setActiveSection("owner")}
          register={register}
        />

        <OwnerInfoSection
          control={control}
          errors={errors}
          isLoading={isLoading}
          isExpanded={activeSection === "owner"}
          onToggle={() => setActiveSection("owner")}
          register={register}
        />

        <Button
          type="submit"
          data-testid="signup-submit-button"
          className="w-full h-12 text-base font-medium shadow-lg transition-all shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex gap-2 items-center">
              <span className="w-4 h-4 rounded-full border-2 animate-spin border-white/30 border-t-white" />
              Kreiranje naloga...
            </span>
          ) : (
            "Kreiraj nalog"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="flex absolute inset-0 items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="flex relative justify-center text-sm">
          <span className="px-3 text-gray-400 bg-gray-50 dark:bg-gray-900">ili</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        data-testid="signup-google-button"
        className="w-full h-11 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <GoogleIcon className="mr-2 w-5 h-5" />
        Nastavite sa Google
      </Button>

      {/* Login Link */}
      <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
        Vec imate nalog?{" "}
        <Link
          href="/login"
          data-testid="signup-login-link"
          className="font-medium text-primary hover:underline underline-offset-2"
        >
          Prijavite se
        </Link>
      </p>
    </div>
  );
}
