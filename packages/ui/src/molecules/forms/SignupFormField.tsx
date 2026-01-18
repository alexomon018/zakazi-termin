"use client";

import type { ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import { Label } from "../../atoms/Label";

interface SignupFormFieldProps {
  id?: string;
  label: string;
  error?: string;
  optional?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function SignupFormField({
  id,
  label,
  error,
  optional,
  icon,
  children,
}: SignupFormFieldProps) {
  const childWithId = (() => {
    if (!id || !isValidElement(children)) {
      return children;
    }
    const props = children.props as { id?: string };
    if (props.id) {
      return children;
    }
    return cloneElement(children, { id } as Record<string, unknown>);
  })();

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="flex gap-1 items-center text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {optional && <span className="text-xs font-normal text-gray-400">(opciono)</span>}
      </Label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 z-10 text-gray-400 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        {childWithId}
      </div>
      {error && <p className="text-sm text-red-500 animate-fade-in">{error}</p>}
    </div>
  );
}
