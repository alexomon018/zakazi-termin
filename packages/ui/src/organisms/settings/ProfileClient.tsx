"use client";

import { trpc } from "@/lib/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
import { AlertCircle, Check, ExternalLink, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1, "Ime je obavezno"),
  username: z
    .string()
    .min(3, "Korisničko ime mora imati najmanje 3 karaktera")
    .regex(/^[a-zA-Z0-9_-]+$/, "Korisničko ime može sadržati samo slova, brojeve, _ i -"),
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

export function ProfileClient({ initialUser }: ProfileClientProps) {
  const [saved, setSaved] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

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
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      bio: user?.bio || "",
      timeZone: user?.timeZone || "Europe/Belgrade",
    },
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
        timeZone: user.timeZone,
      });
    }
  }, [user, reset]);

  const watchedUsername = watch("username");

  // Check username availability
  const { data: usernameCheck } = trpc.user.checkUsername.useQuery(
    { username: watchedUsername },
    {
      enabled:
        !!watchedUsername && watchedUsername.length >= 3 && watchedUsername !== user?.username,
    }
  );

  useEffect(() => {
    if (watchedUsername === user?.username) {
      setUsernameAvailable(null);
    } else if (usernameCheck) {
      setUsernameAvailable(usernameCheck.available);
    }
  }, [usernameCheck, watchedUsername, user?.username]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moj profil</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upravljajte informacijama vašeg profila
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Profil je uspešno sačuvan!</span>
        </div>
      )}

      {updateProfile.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{updateProfile.error.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profilna slika</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vaša profilna slika će se prikazivati na stranici za zakazivanje.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                <Label htmlFor="username" className="text-gray-900 dark:text-white">
                  Korisničko ime
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    {...register("username")}
                    placeholder="marko"
                    className={
                      usernameAvailable === false
                        ? "border-red-500 focus:ring-red-500"
                        : usernameAvailable === true
                          ? "border-green-500 focus:ring-green-500"
                          : ""
                    }
                  />
                  {usernameAvailable !== null && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameAvailable ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="text-sm text-red-600">{errors.username.message}</p>
                )}
                {usernameAvailable === false && (
                  <p className="text-sm text-red-600">Korisničko ime je već zauzeto</p>
                )}
                {user?.username && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    Vaš link:{" "}
                    <a
                      href={`/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      salonko.rs/{user.username}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
              <select
                id="timeZone"
                {...register("timeZone")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
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
            disabled={!isDirty || updateProfile.isPending || usernameAvailable === false}
          >
            {updateProfile.isPending ? "Čuvanje..." : "Sačuvaj promene"}
          </Button>
        </div>
      </form>
    </div>
  );
}
