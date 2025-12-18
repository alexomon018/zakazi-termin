"use client";

import * as React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@zakazi-termin/ui/utils";

interface MobileNavItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

export function MobileNavItem({ href, label, icon: Icon, isActive }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
        isActive
          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          : "text-gray-600 dark:text-gray-300"
      )}
    >
      <Icon className="w-4 h-4 mr-1" />
      {label}
    </Link>
  );
}
