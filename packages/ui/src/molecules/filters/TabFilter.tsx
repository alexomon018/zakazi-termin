"use client";

import * as React from "react";

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
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {label}
    </button>
  );
}
