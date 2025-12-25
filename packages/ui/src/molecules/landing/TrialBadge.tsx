import type * as React from "react";

interface TrialBadgeProps {
  children: React.ReactNode;
}

export function TrialBadge({ children }: TrialBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium">
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      {children}
    </div>
  );
}
