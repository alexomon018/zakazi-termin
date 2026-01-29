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

const MobileBottomNavItem = memo(function MobileBottomNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  requiresSubscription = false,
  isSubscribed = false,
}: MobileNavItemProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  const baseClasses = cn(
    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
    isActive ? "text-primary" : "text-muted-foreground",
    isLocked && "opacity-50 pointer-events-none blur-[1px]"
  );

  if (isLocked) {
    return (
      <div
        aria-disabled="true"
        aria-label={`${label} (zahtevana pretplata)`}
        tabIndex={-1}
        className={baseClasses}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        <span className="truncate max-w-[60px]">{label}</span>
      </div>
    );
  }

  return (
    <Link href={href} className={baseClasses}>
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="truncate max-w-[60px]">{label}</span>
    </Link>
  );
});

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresSubscription?: boolean;
}

interface MobileBottomNavProps {
  navItems: NavItem[];
  currentPath: string;
  isSubscribed?: boolean;
}

export const MobileBottomNav = memo(function MobileBottomNav({
  navItems,
  currentPath,
  isSubscribed = false,
}: MobileBottomNavProps) {
  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === href;
    }
    return currentPath === href || currentPath.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] md:hidden"
      data-testid="mobile-bottom-nav"
    >
      {navItems.map((item) => (
        <MobileBottomNavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={isItemActive(item.href)}
          requiresSubscription={item.requiresSubscription}
          isSubscribed={isSubscribed}
        />
      ))}
    </nav>
  );
});
