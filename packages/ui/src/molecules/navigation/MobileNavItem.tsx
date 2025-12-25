"use client";

import { cn } from "@zakazi-termin/ui/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export const MobileNavItem = React.memo(function MobileNavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
        isActive
          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 mr-1" />
      {label}
    </Link>
  );
});
