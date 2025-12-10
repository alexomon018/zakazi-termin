"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
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

export default function AppearanceSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme>(null);
  const [brandColor, setBrandColor] = useState("#292929");
  const [darkBrandColor, setDarkBrandColor] = useState("#fafafa");

  const utils = trpc.useUtils();
  const { setTheme } = useTheme();

  const { data: user, isLoading } = trpc.user.me.useQuery();

  const updateAppearance = trpc.user.updateAppearance.useMutation({
    onSuccess: () => {
      utils.user.me.invalidate();
      // Apply theme immediately after saving
      setTheme(selectedTheme === null ? "system" : selectedTheme);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // Initialize state from user data
  useEffect(() => {
    if (user) {
      setSelectedTheme(user.theme as Theme);
      setBrandColor(user.brandColor || "#292929");
      setDarkBrandColor(user.darkBrandColor || "#fafafa");
    }
  }, [user]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Izgled</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Učitavanje...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Izgled</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Prilagodite izgled vaše stranice za zakazivanje
        </p>
      </div>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Izgled je uspešno sačuvan!</span>
        </div>
      )}

      {updateAppearance.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{updateAppearance.error.message}</span>
        </div>
      )}

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
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
            {/* Light Theme Brand Color */}
            <div className="space-y-3">
              <Label htmlFor="brandColor" className="text-gray-900 dark:text-white">Boja za svetlu temu</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="brandColor"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="#292929"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Pregled:</span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: brandColor }}
                >
                  Zakaži termin
                </button>
              </div>
            </div>

            {/* Dark Theme Brand Color */}
            <div className="space-y-3">
              <Label htmlFor="darkBrandColor" className="text-gray-900 dark:text-white">Boja za tamnu temu</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="darkBrandColor"
                  value={darkBrandColor}
                  onChange={(e) => setDarkBrandColor(e.target.value)}
                  className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={darkBrandColor}
                    onChange={(e) => setDarkBrandColor(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="#fafafa"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-900 p-3 rounded-lg">
                <span className="text-xs text-gray-400">Pregled:</span>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-gray-900 text-sm font-medium"
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
          <div className="border rounded-lg overflow-hidden">
            <div
              className={cn(
                "p-6",
                selectedTheme === "dark" ? "bg-gray-900" : "bg-white"
              )}
            >
              <div className="max-w-md mx-auto space-y-4">
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
                  className="w-full py-2 rounded-md text-sm font-medium transition-colors"
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
        "p-4 rounded-lg border-2 text-left transition-colors",
        selected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
      )}
    >
      <Icon
        className={cn(
          "w-6 h-6 mb-2",
          selected ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
        )}
      />
      <p
        className={cn(
          "font-medium text-sm",
          selected ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white"
        )}
      >
        {label}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </button>
  );
}
