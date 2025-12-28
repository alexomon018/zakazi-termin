import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { ThemeOption } from "./ThemeOption";

export type Theme = "light" | "dark" | null;

export type ThemeSelectorProps = {
  selectedTheme: Theme;
  onThemeChange: (theme: Theme) => void;
};

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Tema</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Izaberite temu za vašu stranicu za zakazivanje.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <ThemeOption
            icon={Monitor}
            label="Sistemska"
            description="Prati sistemsko podešavanje"
            selected={selectedTheme === null}
            onClick={() => onThemeChange(null)}
          />
          <ThemeOption
            icon={Sun}
            label="Svetla"
            description="Svetla pozadina"
            selected={selectedTheme === "light"}
            onClick={() => onThemeChange("light")}
          />
          <ThemeOption
            icon={Moon}
            label="Tamna"
            description="Tamna pozadina"
            selected={selectedTheme === "dark"}
            onClick={() => onThemeChange("dark")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
