"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@salonko/ui/atoms/DropdownMenu";
import { Calendar, CalendarOff, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useCallback, useState } from "react";

interface MobileTopBarProps {
  user: {
    id: string;
    email: string;
    name?: string | null;
    salonName?: string | null;
    image?: string | null;
  };
  salonIconUrl?: string | null;
}

export const MobileTopBar = memo(function MobileTopBar({ user, salonIconUrl }: MobileTopBarProps) {
  const displayName = user.salonName || user.name || "Salon";
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      setIsOpen(false);
      router.push(href);
    },
    [router]
  );

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      data-testid="mobile-top-bar"
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex gap-2 items-center">
        <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-primary">
          <Calendar className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="text-lg font-semibold text-foreground">Salonko</span>
      </Link>

      {/* Right side: Settings icon + Avatar with dropdown */}
      <div className="flex gap-3 items-center">
        {/* Avatar with dropdown menu */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-full shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Otvori meni korisnika"
            >
              {salonIconUrl ? (
                <img
                  src={salonIconUrl}
                  alt={displayName}
                  className="object-cover w-8 h-8 rounded-full"
                />
              ) : (
                <div className="flex justify-center items-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                  <span className="text-sm font-medium">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuItem
              onClick={() => handleNavigate("/dashboard/settings/profile")}
              className="flex cursor-pointer items-center gap-3 py-2.5"
            >
              <User className="w-5 h-5" aria-hidden="true" />
              <span>Moj profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate("/dashboard/settings")}
              className="flex cursor-pointer items-center gap-3 py-2.5"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
              <span>Podešavanja</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleNavigate("/dashboard/settings/out-of-office")}
              className="flex cursor-pointer items-center gap-3 py-2.5"
            >
              <CalendarOff className="w-5 h-5" aria-hidden="true" />
              <span>Van kancelarije</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="https://zakazi-termin.com/help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex cursor-pointer items-center gap-3 py-2.5"
              >
                <HelpCircle className="w-5 h-5" aria-hidden="true" />
                <span>Pomoć</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex cursor-pointer items-center gap-3 py-2.5 text-destructive focus:text-destructive"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
              <span>Odjava</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
