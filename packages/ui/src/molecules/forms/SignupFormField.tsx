"use client";

import type { ReactNode } from "react";
import { Label } from "../../atoms/Label";

interface SignupFormFieldProps {
  label: string;
  error?: string;
  optional?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function SignupFormField({ label, error, optional, icon, children }: SignupFormFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
        {label}
        {optional && <span className="text-xs text-gray-400 font-normal">(opciono)</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        {children}
      </div>
      {error && <p className="text-sm text-red-500 animate-fade-in">{error}</p>}
    </div>
  );
}
