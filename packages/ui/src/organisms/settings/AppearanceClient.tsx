"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@zakazi-termin/trpc";
import { useTheme } from "@/lib/theme-provider";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
} from "@zakazi-termin/ui";
import { Check, AlertCircle, Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@zakazi-termin/ui";

type Theme = "light" | "dark" | null;
type User = NonNullable<RouterOutputs["user"]["me"]>;

type AppearanceClientProps = {
  initialUser: User | null;
};

export function AppearanceClient({ initialUser }: AppearanceClientProps) {
  const [saved, setSaved] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(
    initialUser?.theme as Theme
  );
  const [brandColor, setBrandColor] = useState(
    initialUser?.brandColor || "#292929"
  );
  const [darkBrandColor, setDarkBrandColor] = useState(
    initialUser?.darkBrandColor || "#fafafa"
  );

  const utils = trpc.useUtils();
  const { setTheme } = useTheme();

  const { data: user, isLoading } = trpc.user.me.useQuery(undefined, {
    initialData: initialUser ?? undefined,
  });

  const updateAppearance = trpc.user.updateAppearance.useMutation({
    onSuccess: async () => {
      // Invalidate and refetch user data
      await utils.user.me.invalidate();
      // Update theme immediately
      setTheme(selectedTheme === null ? "system" : selectedTheme);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  useEffect(() => {
    if (user) {
      setSelectedTheme(user.theme as Theme);
      setBrandColor(user.brandColor || "#292929");
      setDarkBrandColor(user.darkBrandColor || "#fafafa");
    }
  }, [user]);

  // Update theme immediately when selectedTheme changes (for preview)
  useEffect(() => {
    if (selectedTheme !== undefined) {
      setTheme(selectedTheme === null ? "system" : selectedTheme);
    }
  }, [selectedTheme, setTheme]);

  const handleSave = () => {
    updateAppearance.mutate({
      theme: selectedTheme,
      brandColor,
      darkBrandColor,
    });
  };

  const hasChanges =
    selectedTheme !== (user?.theme as Theme) ||
    brandColor !== (user?.brandColor || "#292929") ||
    darkBrandColor !== (user?.darkBrandColor || "#fafafa");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Izgled
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Prilagodite izgled vaše stranice za zakazivanje
        </p>
      </div>

      {saved && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">
            Izgled je uspešno sačuvan!
          </span>
        </div>
      )}

      {updateAppearance.error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">
            {updateAppearance.error.message}
          </span>
        </div>
      )}

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Izaberite temu za vašu stranicu za zakazivanje.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <ThemeOption
              icon={Monitor}
              label="Sistemska"
              description="Prati sistemsko podešavanje"
              selected={selectedTheme === null}
              onClick={() => setSelectedTheme(null)}
            />
            <ThemeOption
              icon={Sun}
              label="Svetla"
              description="Svetla pozadina"
              selected={selectedTheme === "light"}
              onClick={() => setSelectedTheme("light")}
            />
            <ThemeOption
              icon={Moon}
              label="Tamna"
              description="Tamna pozadina"
              selected={selectedTheme === "dark"}
              onClick={() => setSelectedTheme("dark")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boje brenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prilagodite boje vaše stranice za zakazivanje da odgovaraju vašem
            brendu.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label
                htmlFor="brandColor"
                className="text-gray-900 dark:text-white"
              >
                Boja za svetlu temu
              </Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="brandColor"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="px-3 py-2 w-full font-mono text-sm text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="#292929"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pregled:
                </span>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-white rounded-md"
                  style={{ backgroundColor: brandColor }}
                >
                  Zakaži termin
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="darkBrandColor"
                className="text-gray-900 dark:text-white"
              >
                Boja za tamnu temu
              </Label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  id="darkBrandColor"
                  value={darkBrandColor}
                  onChange={(e) => setDarkBrandColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-200 cursor-pointer dark:border-gray-600"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={darkBrandColor}
                    onChange={(e) => setDarkBrandColor(e.target.value)}
                    className="px-3 py-2 w-full font-mono text-sm text-gray-900 bg-white rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="#fafafa"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center p-3 bg-gray-900 rounded-lg">
                <span className="text-xs text-gray-400">Pregled:</span>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-900 rounded-md"
                  style={{ backgroundColor: darkBrandColor }}
                >
                  Zakaži termin
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pregled</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <div
              className={cn(
                "p-6",
                selectedTheme === "dark" ? "bg-gray-900" : "bg-white"
              )}
            >
              <div className="mx-auto space-y-4 max-w-md">
                <div className="text-center">
                  <div
                    className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                      selectedTheme === "dark" ? "bg-gray-800" : "bg-gray-100"
                    )}
                  >
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3
                    className={cn(
                      "font-semibold",
                      selectedTheme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {user?.name || "Vaše ime"}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      selectedTheme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    )}
                  >
                    {user?.bio || "Kratak opis"}
                  </p>
                </div>
                <div
                  className={cn(
                    "p-4 rounded-lg border",
                    selectedTheme === "dark"
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  )}
                >
                  <p
                    className={cn(
                      "font-medium mb-1",
                      selectedTheme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    Konsultacija
                  </p>
                  <p
                    className={cn(
                      "text-sm",
                      selectedTheme === "dark"
                        ? "text-gray-400"
                        : "text-gray-500"
                    )}
                  >
                    30 minuta
                  </p>
                </div>
                <button
                  type="button"
                  className="py-2 w-full text-sm font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor:
                      selectedTheme === "dark" ? darkBrandColor : brandColor,
                    color: selectedTheme === "dark" ? "#111" : "#fff",
                  }}
                >
                  Zakaži termin
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateAppearance.isPending}
        >
          {updateAppearance.isPending ? "Čuvanje..." : "Sačuvaj promene"}
        </Button>
      </div>
    </div>
  );
}

function ThemeOption({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-4 text-left rounded-lg border-2 transition-colors",
        selected
          ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
      )}
    >
      <Icon
        className={cn(
          "mb-2 w-6 h-6",
          selected ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
        )}
      />
      <p
        className={cn(
          "text-sm font-medium",
          selected
            ? "text-blue-700 dark:text-blue-400"
            : "text-gray-900 dark:text-white"
        )}
      >
        {label}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </button>
  );
}
