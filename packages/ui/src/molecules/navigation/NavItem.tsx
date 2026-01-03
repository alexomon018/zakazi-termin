"use client";

import { cn } from "@salonko/ui/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface NavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  requiresSubscription?: boolean;
  isSubscribed?: boolean;
}

export const NavItem = memo(function NavItem({
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
          "text-gray-400 pointer-events-none select-none dark:text-gray-500 blur-[1px]"
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
          ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      <Icon className="flex-shrink-0 mr-1 w-4 h-4 lg:mr-2" />
      <span className="hidden lg:inline">{label}</span>
      <span className="lg:hidden truncate max-w-[80px]">{label}</span>
    </Link>
  );
});
