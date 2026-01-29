"use client";

import { MobileBottomNav } from "@salonko/ui/molecules/navigation/MobileBottomNav";
import { MobileTopBar } from "@salonko/ui/molecules/navigation/MobileTopBar";
import { Calendar, Clock, LayoutDashboard, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { memo } from "react";

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
    label: "Tipovi",
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

interface DashboardMobileNavProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    image?: string | null;
  };
  isSubscribed?: boolean;
  salonIconUrl?: string | null;
}

export const DashboardMobileNav = memo(function DashboardMobileNav({
  user,
  isSubscribed = false,
  salonIconUrl,
}: DashboardMobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      <MobileTopBar user={user} salonIconUrl={salonIconUrl} />
      <MobileBottomNav navItems={navItems} currentPath={pathname} isSubscribed={isSubscribed} />
    </>
  );
});
