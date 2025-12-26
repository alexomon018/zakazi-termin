"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "../../atoms/Button";
import { NavLink } from "../../molecules/landing/NavLink";

interface LandingHeaderProps {
  loginHref?: string;
}

export function LandingHeader({ loginHref = "/login" }: LandingHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar aria-hidden="true" className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Salonko</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="#funkcije" label="Funkcije" />
          <NavLink href="#cene" label="Cene" />
          <NavLink href="#kontakt" label="Kontakt" />
        </nav>
        <Link
          href={loginHref}
          className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Prijavi se
        </Link>
      </div>
    </header>
  );
}
