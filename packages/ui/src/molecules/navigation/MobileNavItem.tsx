"use client";

import { cn } from "@salonko/ui/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  requiresSubscription?: boolean;
  isSubscribed?: boolean;
}

export const MobileNavItem = memo(function MobileNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  requiresSubscription = false,
  isSubscribed = false,
}: MobileNavItemProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  if (isLocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${label} (zahtevana pretplata)`}
        tabIndex={-1}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md",
          "text-gray-400 pointer-events-none select-none dark:text-gray-500 blur-[1px]"
        )}
      >
        <Icon className="mr-1 w-4 h-4" />
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors",
        isActive
          ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      <Icon className="mr-1 w-4 h-4" />
      {label}
    </Link>
  );
});
