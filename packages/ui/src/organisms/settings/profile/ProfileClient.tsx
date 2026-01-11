"use client";

import { trpc } from "@/lib/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@salonko/ui";
import { AlertCircle, Check } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AccountInfoCard } from "./AccountInfoCard";
import { BasicInfoCard } from "./BasicInfoCard";
import { DangerZoneCard } from "./DangerZoneCard";
import { SalonLogoCard } from "./SalonLogoCard";
import { TimeZoneCard } from "./TimeZoneCard";
import type { User } from "./types";

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

export type ProfileFormValues = z.infer<typeof profileSchema>;

type ProfileClientProps = {
  initialUser: User;
};

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const [saved, setSaved] = useState(false);
  const [salonNameAvailable, setSalonNameAvailable] = useState<boolean | null>(null);

  const { update: updateSession } = useSession();
  const utils = trpc.useUtils();

  const { data: user } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser,
  });

  const updateProfile = trpc.user.update.useMutation({
    onSuccess: async (_data, variables) => {
      utils.user.me.invalidate();
      await updateSession({
        name: variables.name,
        salonName: variables.salonName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deleteAccount = trpc.user.deleteAccount.useMutation({
    onSuccess: () => {
      signOut({ callbackUrl: "/" });
    },
  });

  const handleDeleteAccount = (confirmText: string) => {
    deleteAccount.mutate({ confirmText });
  };

  const handleUploadSuccess = () => {
    utils.user.me.invalidate();
  };

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

  if (!user) return null;

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
        <SalonLogoCard user={user} onUploadSuccess={handleUploadSuccess} />

        <BasicInfoCard
          register={register}
          errors={errors}
          salonNameSlug={salonNameSlug}
          salonNameAvailable={salonNameAvailable}
        />

        <TimeZoneCard control={control} />

        <AccountInfoCard user={user} />

        <DangerZoneCard
          onDeleteAccount={handleDeleteAccount}
          isDeleting={deleteAccount.isPending}
          deleteError={deleteAccount.error?.message ?? null}
        />

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
