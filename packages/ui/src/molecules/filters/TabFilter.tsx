"use client";

interface TabFilterProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function TabFilter({ label, isActive, onClick }: TabFilterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-primary/10 text-primary dark:bg-primary/20"
          : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
