"use client";

import { Button } from "@salonko/ui";
import { NavItem } from "@salonko/ui";
import { MobileNavItem } from "@salonko/ui";
import { UserInfoDisplay } from "@salonko/ui";
import useEmblaCarousel from "embla-carousel-react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  // Embla carousel setup for mobile navigation
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

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
    <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <div className="px-2 mx-auto max-w-7xl sm:px-4 lg:px-8">
        <div className="flex gap-2 justify-between items-center h-16 md:gap-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex flex-shrink-0 items-center">
            <span className="text-lg font-bold text-gray-900 md:text-xl dark:text-white">
              Salonko
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center space-x-1 md:flex lg:space-x-2">
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
          <div className="flex flex-shrink-0 items-center space-x-2 md:space-x-3">
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

      <nav className="relative py-2 border-t border-gray-200 md:hidden dark:border-gray-700">
        {/* Left arrow */}
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canScrollPrev}
          className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-opacity ${
            canScrollPrev ? "opacity-100" : "opacity-40 cursor-not-allowed"
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Carousel viewport */}
        <div className="overflow-hidden mx-8" ref={emblaRef}>
          <div className="flex gap-2 px-2">
            {navItemsWithActiveState.map((item) => (
              <div key={item.href} className="flex-shrink-0">
                <MobileNavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={item.isActive}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canScrollNext}
          className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-opacity ${
            canScrollNext ? "opacity-100" : "opacity-40 cursor-not-allowed"
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </nav>
    </header>
  );
}
