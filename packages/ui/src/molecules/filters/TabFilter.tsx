"use client";

interface TabFilterProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  "data-testid"?: string;
}

export function TabFilter({ label, isActive, onClick, "data-testid": testId }: TabFilterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
