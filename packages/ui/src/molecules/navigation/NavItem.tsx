import { cn } from "@salonko/ui/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  requiresSubscription?: boolean;
  isSubscribed?: boolean;
}

export function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  requiresSubscription = false,
  isSubscribed = false,
}: NavItemProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  if (isLocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${label} (zahtevana pretplata)`}
        tabIndex={-1}
        className={cn(
          "flex items-center px-2 py-2 text-xs font-medium whitespace-nowrap rounded-md md:px-2 lg:px-3 md:text-xs lg:text-sm",
          "text-muted-foreground pointer-events-none select-none blur-[1px] opacity-50"
        )}
      >
        <Icon className="flex-shrink-0 mr-1 w-4 h-4 lg:mr-2" />
        <span className="hidden lg:inline">{label}</span>
        <span className="lg:hidden truncate max-w-[80px]">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-2 py-2 text-xs font-medium whitespace-nowrap rounded-md transition-colors md:px-2 lg:px-3 md:text-xs lg:text-sm",
        isActive
          ? "text-foreground bg-muted"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <Icon className="flex-shrink-0 mr-1 w-4 h-4 lg:mr-2" />
      <span className="hidden lg:inline">{label}</span>
      <span className="lg:hidden truncate max-w-[80px]">{label}</span>
    </Link>
  );
}
