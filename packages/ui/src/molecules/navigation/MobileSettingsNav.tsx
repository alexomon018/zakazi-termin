"use client";

import type { MembershipRole } from "@salonko/prisma";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salonko/ui/atoms/DropdownMenu";
import { cn } from "@salonko/ui/utils";
import {
  ArrowLeft,
  Calendar,
  CalendarOff,
  Clock,
  CreditCard,
  LayoutDashboard,
  Menu,
  Palette,
  User,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useMemo, useState } from "react";

type SettingsNavItem = {
  href: string;
  label: string;
  icon: typeof User;
  allowedRoles?: MembershipRole[];
};

const settingsNavItems: SettingsNavItem[] = [
  {
    href: "/dashboard/settings/profile",
    label: "Moj profil",
    icon: User,
  },
  {
    href: "/dashboard/settings/team",
    label: "Tim",
    icon: Users,
    allowedRoles: ["OWNER", "ADMIN"],
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Izgled",
    icon: Palette,
  },
  {
    href: "/dashboard/settings/billing",
    label: "Naplata",
    icon: CreditCard,
    allowedRoles: ["OWNER"],
  },
  {
    href: "/dashboard/settings/out-of-office",
    label: "Van kancelarije",
    icon: CalendarOff,
  },
  {
    href: "/dashboard/settings",
    label: "Kalendar",
    icon: Calendar,
  },
];

// Main dashboard navigation items for the hamburger menu
const mainNavItems = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Termini", icon: Calendar },
  { href: "/dashboard/event-types", label: "Tipovi termina", icon: Clock },
  { href: "/dashboard/availability", label: "Dostupnost", icon: Clock },
];

interface MobileSettingsNavProps {
  userRole?: MembershipRole | null;
}

export const MobileSettingsNav = memo(function MobileSettingsNav({
  userRole = "OWNER",
}: MobileSettingsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  const isItemActive = useCallback(
    (href: string) => {
      if (href === "/dashboard/settings") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href);
    },
    [pathname]
  );

  const visibleNavItems = useMemo(() => {
    if (!userRole) return [];
    return settingsNavItems.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.includes(userRole);
    });
  }, [userRole]);

  const handleNavigate = useCallback(
    (href: string) => {
      setIsSettingsOpen(false);
      setIsMainMenuOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      data-testid="mobile-settings-top-bar"
    >
      {/* Hamburger menu for main navigation */}
      <DropdownMenu open={isMainMenuOpen} onOpenChange={setIsMainMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            aria-label="Otvori glavni meni"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-56"
          data-testid="mobile-main-menu-dropdown"
        >
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5"
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleNavigate("/dashboard/settings/profile")}
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 bg-accent text-accent-foreground"
          >
            <User className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>Podešavanja</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings dropdown chip - styled like Cal.com */}
      <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Podešavanja</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="w-64"
          data-testid="mobile-settings-dropdown"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <DropdownMenuItem
                key={item.href}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5",
                  isActive && "bg-accent text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
});
