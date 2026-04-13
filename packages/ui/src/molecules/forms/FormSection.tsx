"use client";

import { cn } from "@salonko/ui/utils";
import type { ElementType, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../atoms/Card";

export interface FormSectionProps {
  icon?: ElementType;
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FormSection({
  icon: Icon,
  title,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
