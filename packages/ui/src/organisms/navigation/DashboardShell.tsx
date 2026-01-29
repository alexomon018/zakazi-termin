"use client";

import { DashboardMobileNav } from "@salonko/ui/organisms/navigation/DashboardMobileNav";
import { DashboardSidebar } from "@salonko/ui/organisms/navigation/DashboardSidebar";
import { cn } from "@salonko/ui/utils";
import { memo } from "react";

interface DashboardShellProps {
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
  children: React.ReactNode;
  /**
   * Optional custom sidebar to replace the default DashboardSidebar.
   * Used by settings pages to show a settings-specific sidebar.
   */
  customSidebar?: React.ReactNode;
  /**
   * Whether to hide the mobile navigation (top bar + bottom nav).
   * Useful when a custom layout handles its own mobile navigation.
   */
  hideMobileNav?: boolean;
}

export const DashboardShell = memo(function DashboardShell({
  user,
  isSubscribed = false,
  salonIconUrl,
  origin,
  children,
  customSidebar,
  hideMobileNav = false,
}: DashboardShellProps) {
  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900">
      {/* Desktop/Tablet Sidebar - use custom if provided */}
      {customSidebar ?? (
        <DashboardSidebar
          user={user}
          isSubscribed={isSubscribed}
          salonIconUrl={salonIconUrl}
          origin={origin}
        />
      )}

      {/* Mobile Navigation */}
      {!hideMobileNav && (
        <DashboardMobileNav user={user} isSubscribed={isSubscribed} salonIconUrl={salonIconUrl} />
      )}

      {/* Main content area */}
      <main
        className={cn(
          "min-h-dvh",
          // Offset for fixed sidebar on tablet/desktop
          "md:pl-14 lg:pl-56",
          // Offset for fixed bottom nav on mobile (only if mobile nav is shown)
          !hideMobileNav && "pb-16 md:pb-0"
        )}
      >
        {children}
      </main>
    </div>
  );
});
