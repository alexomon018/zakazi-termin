import * as React from "react";
import { Card, CardContent } from "@zakazi-termin/ui";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </CardContent>
    </Card>
  );
}
