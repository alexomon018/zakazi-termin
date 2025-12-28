import { cn } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";
import { Label } from "../../atoms/Label";
import { ColorPicker } from "../../atoms/ColorPicker";

export type BrandColorSectionProps = {
  brandColor: string;
  darkBrandColor: string;
  onBrandColorChange: (color: string) => void;
  onDarkBrandColorChange: (color: string) => void;
};

export function BrandColorSection({
  brandColor,
  darkBrandColor,
  onBrandColorChange,
  onDarkBrandColorChange,
}: BrandColorSectionProps) {
  return (
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
            <ColorPicker
              id="brandColor"
              value={brandColor}
              onChange={onBrandColorChange}
              isDarkMode={false}
            />
            <ColorPreviewButton color={brandColor} isDark={false} />
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="darkBrandColor"
              className="text-gray-900 dark:text-white"
            >
              Boja za tamnu temu
            </Label>
            <ColorPicker
              id="darkBrandColor"
              value={darkBrandColor}
              onChange={onDarkBrandColorChange}
              isDarkMode={true}
            />
            <ColorPreviewButton color={darkBrandColor} isDark={true} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ColorPreviewButton({
  color,
  isDark,
}: {
  color: string;
  isDark: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2 items-center p-3 rounded-lg",
        isDark ? "bg-gray-900" : "bg-gray-50"
      )}
    >
      <span
        className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}
      >
        Pregled:
      </span>
      <button
        type="button"
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-md",
          isDark ? "text-gray-900" : "text-white"
        )}
        style={{ backgroundColor: color }}
      >
        Zakaži termin
      </button>
    </div>
  );
}
