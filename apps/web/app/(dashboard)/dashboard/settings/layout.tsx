"use client";

import { trpc } from "@/lib/trpc/client";
import type { MembershipRole } from "@salonko/prisma";
import { cn } from "@salonko/ui";
import { Calendar, CalendarOff, CreditCard, Palette, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof User;
  description: string;
  /** Roles that can see this nav item. If undefined, visible to all. */
  allowedRoles?: MembershipRole[];
};

const settingsNavItems: NavItem[] = [
  {
    href: "/dashboard/settings/profile",
    label: "Moj profil",
    icon: User,
    description: "Upravljajte svojim profilom",
  },
  {
    href: "/dashboard/settings/team",
    label: "Tim",
    icon: Users,
    description: "Upravljajte članovima tima",
    allowedRoles: ["OWNER", "ADMIN"], // Only OWNER and ADMIN can see team settings
  },
  {
    href: "/dashboard/settings/appearance",
    label: "Izgled",
    icon: Palette,
    description: "Prilagodite izgled aplikacije",
  },
  {
    href: "/dashboard/settings/billing",
    label: "Naplata",
    icon: CreditCard,
    description: "Upravljajte pretplatom",
    allowedRoles: ["OWNER"], // Only OWNER can see billing
  },
  {
    href: "/dashboard/settings/out-of-office",
    label: "Van kancelarije",
    icon: CalendarOff,
    description: "Upravljajte odsustvima",
  },
  {
    href: "/dashboard/settings",
    label: "Kalendar integracije",
    icon: Calendar,
    description: "Povežite spoljne kalendare",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: user, isLoading } = trpc.user.me.useQuery();

  // Get user's role once user data is available - default to OWNER if no membership (solo user/salon owner)
  const userRole: MembershipRole | null = user ? (user.membership?.role ?? "OWNER") : null;

  // Filter nav items based on user role.
  // While loading or before user is available, return a safe default (no items) to avoid flashing OWNER-only links.
  const visibleNavItems = useMemo(() => {
    if (isLoading || !userRole) return [];

    return settingsNavItems.filter((item) => {
      if (!item.allowedRoles) return true;
      return item.allowedRoles.includes(userRole);
    });
  }, [isLoading, userRole]);

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Sidebar */}
      <aside className="flex-shrink-0 lg:w-64">
        <nav className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard/settings"
                ? pathname === "/dashboard/settings"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex gap-3 items-center px-3 py-2 rounded-lg transition-colors",
                  isActive
                    ? "text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="hidden text-xs text-gray-500 dark:text-gray-400 lg:block">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
