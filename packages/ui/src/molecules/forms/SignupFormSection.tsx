"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface SignupFormSectionProps {
  icon: ReactNode;
  title: string;
  badge?: string;
  badgeVariant?: "default" | "primary" | "success";
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function SignupFormSection({
  icon,
  title,
  badge,
  badgeVariant = "default",
  isExpanded,
  onToggle,
  children,
}: SignupFormSectionProps) {
  const badgeStyles = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    primary: "bg-primary/10 text-primary",
    success: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  };

  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300 overflow-hidden
        ${isExpanded ? "border-primary/30 dark:border-primary/20 shadow-lg shadow-primary/5 bg-white dark:bg-gray-800/50" : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30"}
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center transition-colors
              ${isExpanded ? "bg-primary/10 text-primary" : "bg-gray-100 dark:bg-gray-700 text-gray-500"}
            `}
          >
            {icon}
          </div>
          <span
            className={`font-medium transition-colors ${
              isExpanded ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`text-xs px-2 py-1 rounded-full ${badgeStyles[badgeVariant]}`}>
              {badge}
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
