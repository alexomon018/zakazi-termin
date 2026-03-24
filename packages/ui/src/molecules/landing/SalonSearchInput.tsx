"use client";

import { Input } from "@salonko/ui";
import { cn } from "@salonko/ui/utils";
import { Search } from "lucide-react";

interface SalonSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SalonSearchInput({ value, onChange, className }: SalonSearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pretražite salone po imenu, gradu ili usluzi..."
        aria-label="Pretražite salone po imenu, gradu ili usluzi"
        className="pl-10 h-12 text-base rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-primary"
      />
    </div>
  );
}
