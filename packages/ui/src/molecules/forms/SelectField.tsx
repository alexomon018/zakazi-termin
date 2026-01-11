"use client";

import { cn } from "@salonko/ui/utils";
import { Label } from "../../atoms/Label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../atoms/Select";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  helperText?: string;
  className?: string;
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder,
  helperText,
  className,
}: SelectFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-gray-900 dark:text-white">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>}
    </div>
  );
}
