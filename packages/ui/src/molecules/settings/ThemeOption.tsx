import type { ElementType } from "react";
import { cn } from "../../utils";

export type ThemeOptionProps = {
  icon: ElementType;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
};

export function ThemeOption({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: ThemeOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex gap-3 items-center p-4 text-left rounded-lg border-2 transition-colors sm:flex-col sm:items-start sm:gap-0",
        selected
          ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
          : "border-border hover:border-border"
      )}
    >
      <Icon
        className={cn(
          "w-6 h-6 shrink-0 sm:mb-2",
          selected ? "text-blue-500" : "text-muted-foreground"
        )}
      />
      <div>
        <p
          className={cn(
            "text-sm font-medium",
            selected ? "text-blue-700 dark:text-blue-400" : "text-foreground"
          )}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1">{description}</p>
      </div>
    </button>
  );
}
