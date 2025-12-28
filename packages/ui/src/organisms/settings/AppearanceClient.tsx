"use client";

import { useTheme } from "@/lib/theme-provider";
import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { BookingPreview, BrandColorSection, Button, type Theme, ThemeSelector } from "@salonko/ui";
import { AlertCircle, Check } from "lucide-react";
import { useEffect, useState } from "react";

type User = NonNullable<RouterOutputs["user"]["me"]>;

type AppearanceClientProps = {
  initialUser: User | null;
};

export function AppearanceClient({ initialUser }: AppearanceClientProps) {
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(initialUser?.theme as Theme);
  const [brandColor, setBrandColor] = useState(initialUser?.brandColor || "#292929");
  const [darkBrandColor, setDarkBrandColor] = useState(initialUser?.darkBrandColor || "#fafafa");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  const utils = trpc.useUtils();
  const { setTheme } = useTheme();

  // Detect system color scheme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Compute the effective theme for preview
  const previewTheme =
    selectedTheme === null ? (systemPrefersDark ? "dark" : "light") : selectedTheme;

  const { data: user } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser ?? undefined,
  });

  const updateAppearance = trpc.user.updateAppearance.useMutation({
    onSuccess: async () => {
      // Update theme immediately
      setTheme(selectedTheme === null ? "system" : selectedTheme);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Reset initialized to allow re-sync after save
      setInitialized(false);
      // Invalidate and refetch user data
      await utils.user.me.invalidate();
    },
  });

  // Only sync from server on initial load, not on every user object change
  useEffect(() => {
    if (user && !initialized) {
      setSelectedTheme(user.theme as Theme);
      setBrandColor(user.brandColor || "#292929");
      setDarkBrandColor(user.darkBrandColor || "#fafafa");
      setInitialized(true);
    }
  }, [user, initialized]);

  const handleSave = () => {
    updateAppearance.mutate({
      theme: selectedTheme,
      brandColor,
      darkBrandColor,
    });
  };

  const hasChanges =
    selectedTheme !== (user?.theme as Theme) ||
    brandColor.toLowerCase() !== (user?.brandColor || "#292929").toLowerCase() ||
    darkBrandColor.toLowerCase() !== (user?.darkBrandColor || "#fafafa").toLowerCase();

  return (
    <div className="space-y-6 md:px-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Izgled</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Prilagodite izgled vaše stranice za zakazivanje
        </p>
      </div>

      {saved && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Izgled je uspešno sačuvan!</span>
        </div>
      )}

      {updateAppearance.error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{updateAppearance.error.message}</span>
        </div>
      )}

      <ThemeSelector selectedTheme={selectedTheme} onThemeChange={setSelectedTheme} />

      <BrandColorSection
        brandColor={brandColor}
        darkBrandColor={darkBrandColor}
        onBrandColorChange={setBrandColor}
        onDarkBrandColorChange={setDarkBrandColor}
      />

      <BookingPreview
        previewTheme={previewTheme}
        brandColor={brandColor}
        darkBrandColor={darkBrandColor}
        userName={user?.name ?? undefined}
        userBio={user?.bio ?? undefined}
      />

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || updateAppearance.isPending}>
          {updateAppearance.isPending ? "Čuvanje..." : "Sačuvaj promene"}
        </Button>
      </div>
    </div>
  );
}
