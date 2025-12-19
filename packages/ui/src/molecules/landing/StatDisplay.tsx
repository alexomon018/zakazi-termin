import * as React from "react";

interface StatDisplayProps {
  value: string;
  label: string;
}

export function StatDisplay({ value, label }: StatDisplayProps) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
