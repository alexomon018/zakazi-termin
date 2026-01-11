"use client";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useCallback } from "react";

export function LogoutCard() {
  const handleSignOut = useCallback(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2 items-center">
          <LogOut className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg">Odjava</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Odjavite se sa vašeg naloga na ovom uređaju.
        </p>
        <Button
          type="button"
          variant="outline"
          className="border-gray-300 dark:border-gray-600"
          onClick={handleSignOut}
        >
          Odjavi se
        </Button>
      </CardContent>
    </Card>
  );
}
