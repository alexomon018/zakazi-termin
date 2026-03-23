import { type SalonTypeId, getSalonTypeLabel } from "@salonko/config";
import { Badge, Card, CardContent } from "@salonko/ui";
import { cn } from "@salonko/ui/utils";
import { MapPin, Scissors } from "lucide-react";
import Link from "next/link";

export interface SalonCardProps {
  salonName: string;
  salonSlug: string;
  salonCity: string | null;
  salonTypes: string[];
  salonIconUrl: string | null;
  serviceCount: number;
  isOpenNow: boolean;
}

const MAX_VISIBLE_TYPES = 2;

export function SalonCard({
  salonName,
  salonSlug,
  salonCity,
  salonTypes,
  salonIconUrl,
  serviceCount,
  isOpenNow,
}: SalonCardProps) {
  const visibleTypes = salonTypes.slice(0, MAX_VISIBLE_TYPES);
  const overflowCount = salonTypes.length - MAX_VISIBLE_TYPES;

  return (
    <Link href={`/${salonSlug}`} className="block group">
      <Card className="h-full transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-0.5">
        <CardContent className="p-5">
          {/* Header: icon + name */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold",
                salonIconUrl ? "bg-transparent" : "bg-primary/10 text-primary dark:bg-primary/20"
              )}
            >
              {salonIconUrl ? (
                <img
                  src={salonIconUrl}
                  alt={salonName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                salonName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {salonName}
              </h3>
              {salonCity && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{salonCity}</span>
                </p>
              )}
            </div>
          </div>

          {/* Salon type badges */}
          {salonTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {visibleTypes.map((typeId) => (
                <Badge key={typeId} variant="secondary" className="text-xs">
                  {getSalonTypeLabel(typeId as SalonTypeId)}
                </Badge>
              ))}
              {overflowCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  +{overflowCount}
                </Badge>
              )}
            </div>
          )}

          {/* Footer: service count + open status */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Scissors className="w-3.5 h-3.5" />
              {serviceCount}{" "}
              {serviceCount === 1 ? "usluga" : serviceCount < 5 ? "usluge" : "usluga"}
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium",
                isOpenNow ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  isOpenNow ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
              {isOpenNow ? "Otvoreno" : "Zatvoreno"}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
