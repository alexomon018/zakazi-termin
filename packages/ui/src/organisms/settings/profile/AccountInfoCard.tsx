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
          <Label htmlFor="account-email" className="text-foreground">
            Email adresa
          </Label>
          <Input id="account-email" value={user?.email || ""} readOnly className="bg-muted/50" />
          <p className="text-xs text-muted-foreground">Email adresa se ne može promeniti.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="account-provider" className="text-foreground">
            Način prijave
          </Label>
          <Input
            id="account-provider"
            value={user?.identityProvider === "GOOGLE" ? "Google nalog" : "Email i lozinka"}
            readOnly
            className="bg-muted/50"
          />
        </div>
      </CardContent>
    </Card>
  );
}
