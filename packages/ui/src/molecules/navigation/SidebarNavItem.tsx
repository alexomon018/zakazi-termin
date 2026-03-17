import { cn } from "@salonko/ui/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface SidebarNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  isCollapsed?: boolean;
  requiresSubscription?: boolean;
  isSubscribed?: boolean;
}

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  isCollapsed = false,
  requiresSubscription = false,
  isSubscribed = false,
}: SidebarNavItemProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  const baseClasses = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isCollapsed && "justify-center px-2"
  );

  const stateClasses = isActive
    ? "text-primary bg-primary/10 font-semibold"
    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  const lockedClasses = "opacity-50 pointer-events-none blur-[1px]";

  if (isLocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${label} (zahtevana pretplata)`}
        tabIndex={-1}
        className={cn(baseClasses, lockedClasses)}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!isCollapsed && <span className="truncate">{label}</span>}
      </div>
    );
  }

  return (
    <Link href={href} className={cn(baseClasses, stateClasses)}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
