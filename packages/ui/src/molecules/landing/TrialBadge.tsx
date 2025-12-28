import type { ReactNode } from "react";

interface TrialBadgeProps {
  children: ReactNode;
}

export function TrialBadge({ children }: TrialBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary font-medium text-sm border border-primary/20 dark:border-primary/40">
      <span className="w-2 h-2 rounded-full bg-primary dark:bg-primary animate-pulse" />
      {children}
    </div>
  );
}
