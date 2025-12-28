import { cn } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";

export type BookingPreviewProps = {
  previewTheme: "light" | "dark";
  brandColor: string;
  darkBrandColor: string;
  userName?: string;
  userBio?: string;
};

export function BookingPreview({
  previewTheme,
  brandColor,
  darkBrandColor,
  userName,
  userBio,
}: BookingPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pregled</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <div
            className={cn(
              "p-6",
              previewTheme === "dark" ? "bg-gray-900" : "bg-white"
            )}
          >
            <div className="mx-auto space-y-4 max-w-md">
              <div className="text-center">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                    previewTheme === "dark" ? "bg-gray-800" : "bg-gray-100"
                  )}
                >
                  <span className="text-2xl">👤</span>
                </div>
                <h3
                  className={cn(
                    "font-semibold",
                    previewTheme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {userName || "Vaše ime"}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    previewTheme === "dark" ? "text-gray-400" : "text-gray-500"
                  )}
                >
                  {userBio || "Kratak opis"}
                </p>
              </div>
              <div
                className={cn(
                  "p-4 rounded-lg border",
                  previewTheme === "dark"
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                )}
              >
                <p
                  className={cn(
                    "font-medium mb-1",
                    previewTheme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  Konsultacija
                </p>
                <p
                  className={cn(
                    "text-sm",
                    previewTheme === "dark" ? "text-gray-400" : "text-gray-500"
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
                    previewTheme === "dark" ? darkBrandColor : brandColor,
                  color: previewTheme === "dark" ? "#111" : "#fff",
                }}
              >
                Zakaži termin
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
