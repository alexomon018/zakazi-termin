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
  isSubscribed = true,
}: NavItemProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  if (isLocked) {
    return (
      <div
        className={cn(
          "flex items-center px-2 py-2 md:px-2 lg:px-3 text-xs md:text-xs lg:text-sm font-medium rounded-md whitespace-nowrap",
          "text-gray-400 dark:text-gray-500 blur-[1px] pointer-events-none select-none"
        )}
      >
        <Icon className="w-4 h-4 mr-1 lg:mr-2 flex-shrink-0" />
        <span className="hidden lg:inline">{label}</span>
        <span className="lg:hidden truncate max-w-[80px]">{label}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-2 py-2 md:px-2 lg:px-3 text-xs md:text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap",
        isActive
          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 mr-1 lg:mr-2 flex-shrink-0" />
      <span className="hidden lg:inline">{label}</span>
      <span className="lg:hidden truncate max-w-[80px]">{label}</span>
    </Link>
  );
});
