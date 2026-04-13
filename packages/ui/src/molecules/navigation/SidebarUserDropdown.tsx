"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salonko/ui/atoms/DropdownMenu";
import { cn } from "@salonko/ui/utils";
import { CalendarOff, ChevronDown, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";

interface SidebarUserDropdownProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    image?: string | null;
  };
  salonIconUrl?: string | null;
  isCollapsed?: boolean;
}

export const SidebarUserDropdown = memo(function SidebarUserDropdown({
  user,
  salonIconUrl,
  isCollapsed = false,
}: SidebarUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayName = user.salonName || user.name || "Salon";

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent/50",
            isCollapsed && "justify-center px-2"
          )}
          data-testid="sidebar-user-dropdown"
        >
          {salonIconUrl ? (
            <img
              src={salonIconUrl}
              alt={displayName}
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-sm font-medium">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {!isCollapsed && (
            <>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Moj profil</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Podešavanja</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/out-of-office" className="flex items-center gap-2">
            <CalendarOff className="h-4 w-4" />
            <span>Van kancelarije</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="https://zakazi-termin.com/help"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Pomoć</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Odjava</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
