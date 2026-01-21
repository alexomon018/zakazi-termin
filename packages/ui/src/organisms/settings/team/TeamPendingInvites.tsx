import { Button, Card, CardContent, CardHeader, CardTitle } from "@salonko/ui";
import { Copy, Mail, RefreshCw, Trash2 } from "lucide-react";

import { roleLabels } from "./constants";
import type { Invite } from "./types";

type TeamPendingInvitesProps = {
  invites: Invite[];
  isResendPending: boolean;
  onResendInvite: (email: string) => void;
  onCopyLink: (invite: Invite) => void;
  onDeleteInvite: (invite: Invite) => void;
};

export function TeamPendingInvites({
  invites,
  isResendPending,
  onResendInvite,
  onCopyLink,
  onDeleteInvite,
}: TeamPendingInvitesProps) {
  if (!invites.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-lg">
          <Mail className="w-5 h-5" />
          Pozivnice na čekanju ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {invites.map((invite) => (
            <div
              key={invite.token}
              className="flex flex-col gap-3 justify-between p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate dark:text-white">
                  {invite.email || "Link za pozivnicu"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {roleLabels[invite.role ?? "MEMBER"] ?? "Član"} · Ističe{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("sr-Latn")}
                </p>
              </div>

              <div className="flex gap-2 items-center">
                {invite.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResendInvite(invite.email!)}
                    disabled={isResendPending}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-1 ${isResendPending ? "animate-spin" : ""}`}
                    />
                    Ponovo pošalji
                  </Button>
                )}
                {!invite.email && (
                  <Button variant="ghost" size="sm" onClick={() => onCopyLink(invite)}>
                    <Copy className="mr-1 w-4 h-4" />
                    Kopiraj link
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDeleteInvite(invite)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
