"use client";

interface NavLinkProps {
  href: string;
  label: string;
  onClick?: () => void;
}

export function NavLink({ href, label, onClick }: NavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="block py-2 text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md px-2 -mx-2"
    >
      {label}
    </a>
  );
}
