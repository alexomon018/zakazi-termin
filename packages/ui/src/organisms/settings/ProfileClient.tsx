"use client";

import { trpc } from "@/lib/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RouterOutputs } from "@salonko/trpc";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salonko/ui";
import { AlertCircle, Check, ExternalLink, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Ime je obavezno"),
  salonName: z
    .string()
    .min(3, "Naziv salona mora imati najmanje 3 karaktera")
    .max(30, "Naziv salona može imati najviše 30 karaktera")
    .regex(/^[a-zA-Z0-9\s_-]+$/, "Naziv salona može sadržati samo slova, brojeve, razmake, _ i -")
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-")),
  bio: z.string().optional(),
  timeZone: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const TIMEZONES = [
  { value: "Europe/Belgrade", label: "Beograd (GMT+1)" },
  { value: "Europe/Zagreb", label: "Zagreb (GMT+1)" },
  { value: "Europe/Sarajevo", label: "Sarajevo (GMT+1)" },
  { value: "Europe/Podgorica", label: "Podgorica (GMT+1)" },
  { value: "Europe/Skopje", label: "Skoplje (GMT+1)" },
  { value: "Europe/Ljubljana", label: "Ljubljana (GMT+1)" },
  { value: "Europe/Vienna", label: "Beč (GMT+1)" },
  { value: "Europe/Berlin", label: "Berlin (GMT+1)" },
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "America/New_York", label: "Njujork (GMT-5)" },
];

type User = NonNullable<RouterOutputs["user"]["me"]>;

type ProfileClientProps = {
  initialUser: User;
};

/**
 * Renders and manages the user profile form, including validation, salon name availability checks, and submission handling.
 *
 * @param initialUser - Initial user data used to populate and reset the form fields
 * @returns The profile-management React element containing editable fields (name, salon name, bio, time zone), read-only account info, salon logo preview, availability indicators, and save controls
 */
export function ProfileClient({ initialUser }: ProfileClientProps) {
  const [saved, setSaved] = useState(false);
  const [salonNameAvailable, setSalonNameAvailable] = useState<boolean | null>(null);

  const utils = trpc.useUtils();

  const { data: user } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser,
  });

  const updateProfile = trpc.user.update.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      salonName: user?.salonName || "",
      bio: user?.bio || "",
      timeZone: user?.timeZone || "Europe/Belgrade",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        salonName: user.salonName || "",
        bio: user.bio || "",
        timeZone: user.timeZone,
      });
    }
  }, [user, reset]);

  const watchedSalonName = watch("salonName");
  const salonNameSlug = watchedSalonName?.toLowerCase().replace(/\s+/g, "-") || "";

  // Check salonName availability
  const { data: salonNameCheck } = trpc.user.checkSalonName.useQuery(
    { salonName: salonNameSlug },
    {
      enabled: !!salonNameSlug && salonNameSlug.length >= 3 && salonNameSlug !== user?.salonName,
    }
  );

  useEffect(() => {
    if (salonNameSlug === user?.salonName) {
      setSalonNameAvailable(null);
    } else if (salonNameCheck) {
      setSalonNameAvailable(salonNameCheck.available);
    }
  }, [salonNameCheck, salonNameSlug, user?.salonName]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moj profil</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Upravljajte informacijama vašeg profila
        </p>
      </div>

      {saved && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Profil je uspešno sačuvan!</span>
        </div>
      )}

      {updateProfile.error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{updateProfile.error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Salon Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logo salona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex overflow-hidden justify-center items-center w-20 h-20 bg-gray-200 rounded-full dark:bg-gray-700 flex-shrink-0">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.salonName || user.name || "Logo"}
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Logo vašeg salona će se prikazivati na stranici za zakazivanje.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Preporučena veličina: 256x256 piksela
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
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
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.salonName && (
                  <p className="text-sm text-red-600">{errors.salonName.message}</p>
                )}
                {salonNameAvailable === false && (
                  <p className="text-sm text-red-600">Naziv salona je već zauzet</p>
                )}
                <p className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
                  Vaš link:{" "}
                  {salonNameSlug ? (
                    <a
                      href={`/${salonNameSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex gap-1 items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      salonko.rs/{salonNameSlug}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span>salonko.rs/naziv-salona</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-900 dark:text-white">
                O vama
              </Label>
              <textarea
                id="bio"
                {...register("bio")}
                rows={3}
                className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-md border border-gray-300 resize-none dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kratak opis o vama koji će se prikazati na stranici za zakazivanje..."
              />
              {errors.bio && <p className="text-sm text-red-600">{errors.bio.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Time & Locale */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vremenska zona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timeZone" className="text-gray-900 dark:text-white">
                Vremenska zona
              </Label>
              <Controller
                name="timeZone"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="timeZone" className="w-full">
                      <SelectValue placeholder="Izaberite vremensku zonu" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sva vremena u aplikaciji biće prikazana u ovoj vremenskoj zoni.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Info (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Podaci naloga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Email adresa</Label>
              <Input value={user?.email || ""} disabled className="bg-gray-50 dark:bg-gray-700" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email adresa se ne može promeniti.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-900 dark:text-white">Način prijave</Label>
              <Input
                value={user?.identityProvider === "GOOGLE" ? "Google nalog" : "Email i lozinka"}
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isDirty || updateProfile.isPending || salonNameAvailable === false}
          >
            {updateProfile.isPending ? "Čuvanje..." : "Sačuvaj promene"}
          </Button>
        </div>
      </form>
    </div>
  );
}