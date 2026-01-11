"use client";

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from "@salonko/ui";
import type { User } from "./types";

type AccountInfoCardProps = {
  user: User;
};

export function AccountInfoCard({ user }: AccountInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Podaci naloga</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-white">Email adresa</Label>
          <Input value={user?.email || ""} disabled className="bg-gray-50 dark:bg-gray-700" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Email adresa se ne može promeniti.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-900 dark:text-white">Način prijave</Label>
          <Input
            value={user?.identityProvider === "GOOGLE" ? "Google nalog" : "Email i lozinka"}
            disabled
            className="bg-gray-50 dark:bg-gray-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}
