import { Card, CardContent } from "@salonko/ui";
import type { ComponentType } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
