"use client";

import { Button } from "@salonko/ui/atoms/Button";
import { cn } from "@salonko/ui/utils";
import { Calendar, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LandingHeaderProps {
  loginHref?: string;
}

export function LandingHeader({ loginHref = "/login" }: LandingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#funkcije", label: "Funkcije" },
    { href: "#kako-radi", label: "Kako radi" },
    { href: "#cene", label: "Cene" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        isScrolled
          ? "bg-white/95 dark:bg-background/95 backdrop-blur-sm border-b border-gray-200 dark:border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <Calendar className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-xl font-semibold text-foreground">Salonko</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="items-center hidden gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="items-center hidden gap-3 md:flex">
          <Link
            href={loginHref}
            className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground"
          >
            Prijavi se
          </Link>
          <Button size="sm" asChild>
            <Link href="/signup">Započni besplatno</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="p-2 -mr-2 rounded-md md:hidden text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-muted"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Zatvori meni" : "Otvori meni"}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 md:hidden dark:border-border bg-white dark:bg-background">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 space-y-3 border-t border-gray-200 dark:border-border">
              <Link
                href={loginHref}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Prijavi se
              </Link>
              <Button className="w-full" asChild>
                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  Započni besplatno
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
