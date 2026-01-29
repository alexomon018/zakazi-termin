"use client";

import { cn } from "@salonko/ui/utils";
import { Check, Copy, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useState } from "react";

interface SidebarFooterProps {
  salonSlug?: string | null;
  origin: string;
  isCollapsed?: boolean;
}

export const SidebarFooter = memo(function SidebarFooter({
  salonSlug,
  origin,
  isCollapsed = false,
}: SidebarFooterProps) {
  const [copied, setCopied] = useState(false);

  const publicUrl = salonSlug ? `${origin}/${salonSlug}` : null;

  const handleCopyLink = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }, [publicUrl]);

  const baseClasses = cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-accent-foreground",
    isCollapsed && "justify-center px-2"
  );

  return (
    <div className="flex flex-col gap-1">
      {publicUrl && (
        <>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={baseClasses}>
            <ExternalLink className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!isCollapsed && <span className="truncate">Pogledaj javnu stranicu</span>}
          </a>
          <button type="button" onClick={handleCopyLink} className={baseClasses}>
            {copied ? (
              <Check className="h-5 w-5 shrink-0 text-green-500" aria-hidden="true" />
            ) : (
              <Copy className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            {!isCollapsed && (
              <span className="truncate">{copied ? "Kopirano!" : "Kopiraj link"}</span>
            )}
          </button>
        </>
      )}
      <Link href="/dashboard/settings" className={baseClasses}>
        <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!isCollapsed && <span className="truncate">Podešavanja</span>}
      </Link>
    </div>
  );
});
