"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "../utils";

interface FormErrorMessageProps {
  message?: string;
  className?: string;
}

export function FormErrorMessage({ message, className }: FormErrorMessageProps) {
  if (!message) return null;

  return (
    <p className={cn("flex gap-1 items-center text-xs text-destructive", className)}>
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}
