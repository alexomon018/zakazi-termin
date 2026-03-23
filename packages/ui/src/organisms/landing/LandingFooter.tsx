import { Calendar } from "lucide-react";
import Link from "next/link";

export function LandingFooter() {
  const footerSections = [
    {
      title: "Za klijente",
      links: [
        { label: "Pronađi salon", href: "/saloni" },
        { label: "Svi saloni", href: "/saloni" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Za salone",
      links: [
        { label: "Funkcije", href: "/za-salone#funkcije" },
        { label: "Cene", href: "/za-salone#cene" },
        { label: "Kako radi", href: "/za-salone#kako-radi" },
        { label: "Započni besplatno", href: "/signup" },
      ],
    },
    {
      title: "Podrška",
      links: [
        { label: "Centar za pomoć", href: "/help" },
        { label: "Kontaktiraj podršku", href: "/help/podrska" },
        { label: "Politika privatnosti", href: "/privacy-policy" },
        { label: "Kolačići", href: "/cookies" },
      ],
    },
  ];

  return (
    <footer
      id="kontakt"
      className="py-12 border-t border-gray-200 dark:border-border bg-gray-50 dark:bg-muted/30"
    >
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <Calendar className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-semibold text-foreground">Salonko</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Pronađite i zakažite termin u najboljim salonima u Srbiji.
            </p>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 mt-12 text-sm text-center border-t border-gray-200 dark:border-border text-muted-foreground">
          © {new Date().getFullYear()} Salonko. Sva prava zadržana.
        </div>
      </div>
    </footer>
  );
}
