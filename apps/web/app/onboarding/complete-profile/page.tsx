"use client";

import { trpc } from "@/lib/trpc/client";
import { type OnboardingFormData, onboardingSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { SALON_TYPES } from "@salonko/config";
import {
  AuthHeader,
  Card,
  CardContent,
  Checkbox,
  FormErrorMessage,
  GooglePlacesSearch,
  Input,
  Label,
  LoadingButton,
  PhoneInput,
  type PlaceResult,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  ServerErrorAlert,
} from "@salonko/ui";
import { Button } from "@salonko/ui";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";

function getSelectedTypesLabel(selectedSalonTypes: string[]) {
  if (!selectedSalonTypes || selectedSalonTypes.length === 0) {
    return "Tip salona (npr. frizerski salon, masaz...";
  }
  const labels = selectedSalonTypes
    .map((id) => SALON_TYPES.find((t) => t.id === id)?.label)
    .filter(Boolean);
  if (labels.length <= 2) {
    return labels.join(", ");
  }
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2}`;
}

interface SalonTypeSelectProps {
  selectedTypes: string[];
  onToggle: (typeId: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  error?: string;
}

function SalonTypeSelect({
  selectedTypes,
  onToggle,
  isOpen,
  onOpenChange,
  disabled,
  error,
}: SalonTypeSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Tip salona</Label>
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="justify-between w-full h-11 font-normal transition-colors bg-background/50 border-border/50 hover:bg-background hover:border-border"
            disabled={disabled}
          >
            <span className="truncate">{getSelectedTypesLabel(selectedTypes)}</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 opacity-50 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-80" align="start">
          <ScrollArea className="h-72">
            <div className="p-2">
              {SALON_TYPES.map((type) => (
                <label
                  key={type.id}
                  htmlFor={`salon-type-${type.id}`}
                  className="flex items-center px-2 py-2 space-x-3 rounded-sm cursor-pointer hover:bg-accent"
                >
                  <Checkbox
                    id={`salon-type-${type.id}`}
                    checked={selectedTypes?.includes(type.id)}
                    onCheckedChange={() => onToggle(type.id)}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t">
            <Button type="button" className="w-full" onClick={() => onOpenChange(false)}>
              Gotovo
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <FormErrorMessage message={error} />
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}

function FormField({ id, label, error, optional, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && (
          <span className="text-xs font-normal text-muted-foreground ml-1">(opciono)</span>
        )}
      </Label>
      {children}
      <FormErrorMessage message={error} />
    </div>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);
  const [salonTypePopoverOpen, setSalonTypePopoverOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const completeOnboarding = trpc.user.completeOnboarding.useMutation({
    onSuccess: async (data) => {
      setIsRedirecting(true);
      await updateSession({ salonName: data.salonName });
      router.push("/dashboard");
    },
    onError: (error) => {
      setServerError(error.message);
    },
  });

  const isLoading = completeOnboarding.isPending || isRedirecting;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      salonName: session?.user?.salonName || "",
      salonTypes: [],
      salonEmail: "",
      googlePlaceId: "",
    },
  });

  const selectedSalonTypes = watch("salonTypes", []);

  const handlePlaceSelect = (place: PlaceResult) => {
    setValue("salonName", place.name.replace(/"/g, ""));
    if (place.city) setValue("salonCity", place.city);
    if (place.streetAddress) setValue("salonAddress", place.streetAddress);
    if (place.phone) setValue("salonPhone", place.phone);
    if (place.placeId) setValue("googlePlaceId", place.placeId);
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

  const onSubmit = (data: OnboardingFormData) => {
    setServerError(null);
    completeOnboarding.mutate({
      salonName: data.salonName,
      salonTypes: data.salonTypes,
      salonPhone: data.salonPhone,
      salonEmail: data.salonEmail || "",
      salonCity: data.salonCity,
      salonAddress: data.salonAddress,
      googlePlaceId: data.googlePlaceId || "",
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in-up">
      <AuthHeader
        title="Završite podešavanje vašeg salona"
        subtitle={`Dobrodosli, ${session?.user?.name || "korisnik"}! Samo još nekoliko koraka...`}
      />

      <Card className="border-0 backdrop-blur-sm shadow-elevated-lg bg-card/80">
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ServerErrorAlert message={serverError} />

            {/* Google Maps Section */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Google Maps povezivanje
                </h3>
                <span className="text-sm font-medium text-primary">
                  Preporuceno za brzu registraciju
                </span>
              </div>
              <Card className="border-dashed border-border/50 bg-background/50">
                <CardContent className="px-4 py-5 sm:px-6">
                  <p className="mb-4 text-sm text-center text-gray-600 dark:text-gray-400">
                    Pronadji svoj salon na Google Maps i automatski popuni naziv, adresu i radno
                    vreme.
                  </p>
                  <GooglePlacesSearch
                    apiKey={GOOGLE_PLACES_API_KEY}
                    onPlaceSelect={handlePlaceSelect}
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Salon Info Section */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Osnovne informacije
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Podaci koji se prikazuju klijentima
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField id="salonName" label="Naziv salona" error={errors.salonName?.message}>
                  <Input
                    id="salonName"
                    type="text"
                    placeholder="Moj Salon"
                    disabled={isLoading}
                    className="h-11 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                    {...register("salonName")}
                  />
                </FormField>

                <SalonTypeSelect
                  selectedTypes={selectedSalonTypes}
                  onToggle={toggleSalonType}
                  isOpen={salonTypePopoverOpen}
                  onOpenChange={setSalonTypePopoverOpen}
                  disabled={isLoading}
                  error={errors.salonTypes?.message}
                />

                <FormField
                  id="salonPhone"
                  label="Telefon salona"
                  error={errors.salonPhone?.message}
                >
                  <Controller
                    name="salonPhone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        id="salonPhone"
                        defaultCountry="RS"
                        placeholder="+381"
                        disabled={isLoading}
                        value={field.value}
                        onChange={field.onChange}
                        className="h-11"
                      />
                    )}
                  />
                </FormField>

                <FormField
                  id="salonEmail"
                  label="Email salona"
                  error={errors.salonEmail?.message}
                  optional
                >
                  <Input
                    id="salonEmail"
                    type="email"
                    placeholder="salon@email.com"
                    disabled={isLoading}
                    className="h-11 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                    {...register("salonEmail")}
                  />
                </FormField>

                <FormField id="salonCity" label="Grad" error={errors.salonCity?.message}>
                  <Input
                    id="salonCity"
                    type="text"
                    placeholder="Beograd"
                    disabled={isLoading}
                    className="h-11 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                    {...register("salonCity")}
                  />
                </FormField>

                <FormField id="salonAddress" label="Adresa" error={errors.salonAddress?.message}>
                  <Input
                    id="salonAddress"
                    type="text"
                    placeholder="Ulica i broj"
                    disabled={isLoading}
                    className="h-11 transition-colors bg-background/50 border-border/50 focus:border-primary focus:bg-background"
                    {...register("salonAddress")}
                  />
                </FormField>
              </div>
            </div>

            <LoadingButton
              type="submit"
              className="w-full h-12 text-base font-medium transition-all duration-300 shadow-glow hover:shadow-lg"
              isLoading={isLoading}
              loadingText="Čuvanje..."
            >
              Sačuvaj i nastavi na dashboard
            </LoadingButton>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Odjavi se
        </Button>
      </div>
    </div>
  );
}
