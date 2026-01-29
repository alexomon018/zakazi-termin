"use client";

import type { MembershipRole } from "@salonko/prisma";
import { Separator } from "@salonko/ui/atoms/Separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@salonko/ui/atoms/Tooltip";
import { SidebarNavItem } from "@salonko/ui/molecules/navigation/SidebarNavItem";
import { cn } from "@salonko/ui/utils";
import { ArrowLeft, Calendar, CalendarOff, CreditCard, Palette, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useCallback, useMemo } from "react";

type SettingsNavItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof User;
  /** Roles that can see this nav item. If undefined, visible to all. */
  allowedRoles?: MembershipRole[];
};

const settingsNavItems: SettingsNavItem[] = [
  {
    href: "/dashboard/settings/profile",
    label: "Moj profil",
    description: "Upravljajte svojim profilom",
    icon: User,
  },
  {
    href: "/dashboard/settings/team",
    label: "Tim",
    description: "Upravljajte članovima tima",
    icon: Users,
    allowedRoles: ["OWNER", "ADMIN"],
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Izgled",
    description: "Prilagodite izgled aplikacije",
    icon: Palette,
  },
  {
    href: "/dashboard/settings/billing",
    label: "Naplata",
    description: "Upravljajte pretplatom",
    icon: CreditCard,
    allowedRoles: ["OWNER"],
  },
  {
    href: "/dashboard/settings/out-of-office",
    label: "Van kancelarije",
    description: "Upravljajte odsustvima",
    icon: CalendarOff,
  },
  {
    href: "/dashboard/settings",
    label: "Kalendar integracije",
    description: "Povežite spoljne kalendare",
    icon: Calendar,
  },
];

interface SettingsSidebarProps {
  /** User's membership role for filtering nav items. Defaults to OWNER if not provided. */
  userRole?: MembershipRole | null;
}

export const SettingsSidebar = memo(function SettingsSidebar({
  userRole = "OWNER",
}: SettingsSidebarProps) {
  const pathname = usePathname();

  const isItemActive = useCallback(
    (href: string) => {
      // Special case: /dashboard/settings root should only match exact path
      if (href === "/dashboard/settings") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href);
    },
    [pathname]
  );

  // Filter nav items based on user role
  const visibleNavItems = useMemo(() => {
    if (!userRole) return [];

    return settingsNavItems.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.includes(userRole);
    });
  }, [userRole]);

  const navItemsWithActiveState = useMemo(
    () =>
      visibleNavItems.map((item) => ({
        ...item,
        isActive: isItemActive(item.href),
      })),
    [visibleNavItems, isItemActive]
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden z-40 md:flex md:flex-col md:fixed md:inset-y-0 md:left-0",
          "w-14 border-r lg:w-56 border-border bg-card"
        )}
        data-testid="settings-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* Back to dashboard header */}
          <div className="p-2 lg:p-3">
            {/* Collapsed mode: icon only with tooltip */}
            <div className="lg:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="flex justify-center items-center p-2 rounded-md transition-colors text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                    <span className="sr-only">Nazad na pregled</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Nazad na pregled</TooltipContent>
              </Tooltip>
            </div>
            {/* Expanded mode: full back link */}
            <div className="hidden lg:block">
              <Link
                href="/dashboard"
                className="flex gap-3 items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
              >
                <ArrowLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="truncate">Nazad na pregled</span>
              </Link>
            </div>
          </div>

          <Separator />

          {/* Settings title (expanded mode only) */}
          <div className="hidden px-5 py-3 lg:block">
            <h2 className="text-lg font-semibold text-foreground">Podešavanja</h2>
          </div>

          {/* Navigation items */}
          <nav className="overflow-y-auto flex-1 p-2 lg:p-3" data-testid="settings-sidebar-nav">
            <div className="flex flex-col gap-1">
              {navItemsWithActiveState.map((item) => (
                <div key={item.href}>
                  {/* Collapsed mode: show with tooltip */}
                  <div className="lg:hidden">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <SidebarNavItem
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                            isActive={item.isActive}
                            isCollapsed
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Expanded mode: show full label with description */}
                  <div className="hidden lg:block">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                        item.isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-xs truncate text-muted-foreground">{item.description}</p>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
});
