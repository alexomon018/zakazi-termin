"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@zakazi-termin/ui";
import { Calendar, Clock, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@zakazi-termin/ui";

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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Zakazi Termin</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href ||
                              (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Odjava
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="md:hidden border-t border-gray-200 px-4 py-2">
        <div className="flex space-x-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600"
                )}
              >
                <Icon className="w-4 h-4 mr-1" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
