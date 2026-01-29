"use client";

import { Separator } from "@salonko/ui/atoms/Separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@salonko/ui/atoms/Tooltip";
import { SidebarFooter } from "@salonko/ui/molecules/navigation/SidebarFooter";
import { SidebarNavItem } from "@salonko/ui/molecules/navigation/SidebarNavItem";
import { SidebarUserDropdown } from "@salonko/ui/molecules/navigation/SidebarUserDropdown";
import { cn } from "@salonko/ui/utils";
import { Calendar, Clock, LayoutDashboard, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { memo, useCallback, useMemo } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Pregled",
    icon: LayoutDashboard,
    requiresSubscription: false,
  },
  {
    href: "/dashboard/bookings",
    label: "Termini",
    icon: Calendar,
    requiresSubscription: true,
  },
  {
    href: "/dashboard/event-types",
    label: "Tipovi termina",
    icon: Clock,
    requiresSubscription: true,
  },
  {
    href: "/dashboard/availability",
    label: "Dostupnost",
    icon: Clock,
    requiresSubscription: true,
  },
];

interface DashboardSidebarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    image?: string | null;
    salonSlug?: string | null;
  };
  isSubscribed?: boolean;
  salonIconUrl?: string | null;
  origin: string;
}

export const DashboardSidebar = memo(function DashboardSidebar({
  user,
  isSubscribed = false,
  salonIconUrl,
  origin,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isItemActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href);
    },
    [pathname]
  );

  const navItemsWithActiveState = useMemo(
    () => navItems.map((item) => ({ ...item, isActive: isItemActive(item.href) })),
    [isItemActive]
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden z-40 md:flex md:flex-col md:fixed md:inset-y-0 md:left-0",
          "w-14 border-r lg:w-56 border-border bg-card"
        )}
        data-testid="dashboard-sidebar"
      >
        <div className="flex flex-col h-full">
          {/* User dropdown at top */}
          <div className="p-2 lg:p-3">
            {/* Collapsed mode: show avatar only with tooltip */}
            <div className="lg:hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <SidebarUserDropdown user={user} salonIconUrl={salonIconUrl} isCollapsed />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {user.salonName || user.name || "Salon"}
                </TooltipContent>
              </Tooltip>
            </div>
            {/* Expanded mode: show full dropdown */}
            <div className="hidden lg:block">
              <SidebarUserDropdown user={user} salonIconUrl={salonIconUrl} />
            </div>
          </div>

          <Separator />

          {/* Navigation items */}
          <nav className="overflow-y-auto flex-1 p-2 lg:p-3" data-testid="sidebar-nav">
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
                            requiresSubscription={item.requiresSubscription}
                            isSubscribed={isSubscribed}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </div>
                  {/* Expanded mode: show full label */}
                  <div className="hidden lg:block">
                    <SidebarNavItem
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={item.isActive}
                      requiresSubscription={item.requiresSubscription}
                      isSubscribed={isSubscribed}
                    />
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="mt-auto">
            <Separator />
            <div className="p-2 lg:p-3">
              {/* Collapsed mode: show icons with tooltips */}
              <div className="lg:hidden">
                <SidebarFooter salonSlug={user.salonSlug} origin={origin} isCollapsed />
              </div>
              {/* Expanded mode: show full labels */}
              <div className="hidden lg:block">
                <SidebarFooter salonSlug={user.salonSlug} origin={origin} />
              </div>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
});
