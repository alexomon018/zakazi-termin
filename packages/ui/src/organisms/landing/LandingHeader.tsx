"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { useScrollPosition } from "@salonko/ui/hooks/useScrollPosition";
import { NavLink } from "@salonko/ui/molecules/landing/NavLink";
import { cn } from "@salonko/ui/utils";
import { Calendar, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface LandingHeaderProps {
  loginHref?: string;
}

export function LandingHeader({ loginHref = "/login" }: LandingHeaderProps) {
  const { isScrolled } = useScrollPosition(20);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "backdrop-blur-md glass border-border/50 shadow-elevated bg-card/80"
          : "border-border bg-card"
      )}
    >
      <div className="flex justify-between items-center px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Link href="/" className="flex gap-2 items-center">
          <Calendar
            aria-hidden="true"
            className="w-8 h-8 transition-transform text-primary hover:scale-110"
          />
          <span className="text-2xl font-bold text-foreground">Salonko</span>
        </Link>
        <nav className="hidden gap-6 items-center md:flex">
          <NavLink href="#funkcije" label="Funkcije" />
          <NavLink href="#cene" label="Cene" />
          <NavLink href="#kontakt" label="Kontakt" />
        </nav>
        <div className="flex gap-4 items-center">
          <Link
            href={loginHref}
            className="hidden justify-center items-center px-4 py-2 h-10 text-sm font-medium bg-transparent rounded-md border transition-all duration-200 md:inline-flex ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-input hover:bg-accent hover:text-accent-foreground hover:scale-105"
          >
            Prijavi se
          </Link>
          <button
            type="button"
            className="p-2 rounded-md transition-colors md:hidden text-foreground hover:bg-accent"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="border-t md:hidden border-border bg-card animate-fade-in">
          <nav className="px-4 py-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <NavLink
                href="#funkcije"
                label="Funkcije"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <NavLink href="#cene" label="Cene" onClick={() => setIsMobileMenuOpen(false)} />
              <NavLink href="#kontakt" label="Kontakt" onClick={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="pt-3 border-t border-border">
              <Link
                href={loginHref}
                className="flex justify-center items-center px-4 py-2 w-full h-10 text-sm font-medium text-center bg-transparent rounded-md border transition-all duration-200 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-input hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Prijavi se
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
