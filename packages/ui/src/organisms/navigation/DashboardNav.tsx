"use client";

import { Button } from "@zakazi-termin/ui";
import { NavItem } from "@zakazi-termin/ui";
import { MobileNavItem } from "@zakazi-termin/ui";
import { UserInfoDisplay } from "@zakazi-termin/ui";
import { Calendar, Clock, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

interface DashboardNavProps {
  user: {
    id: number;
    email: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { href: "/dashboard", label: "Pregled", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Termini", icon: Calendar },
  { href: "/dashboard/event-types", label: "Tipovi termina", icon: Clock },
  { href: "/dashboard/availability", label: "Dostupnost", icon: Clock },
  { href: "/dashboard/settings", label: "Podešavanja", icon: Settings },
];

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  // Memoize the callback for checking active state
  const isItemActive = useCallback(
    (href: string) => {
      return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    },
    [pathname]
  );

  // Memoize nav items with their active states
  const navItemsWithActiveState = useMemo(
    () => navItems.map((item) => ({ ...item, isActive: isItemActive(item.href) })),
    [isItemActive]
  );

  // Memoize sign out handler
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-2 md:gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center flex-shrink-0">
            <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              Zakazi Termin
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItemsWithActiveState.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={item.isActive}
              />
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
            <div className="hidden lg:block">
              <UserInfoDisplay name={user.name || ""} email={user.email} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Odjava</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="md:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto">
          {navItemsWithActiveState.map((item) => (
            <MobileNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={item.isActive}
            />
          ))}
        </div>
      </nav>
    </header>
  );
}
