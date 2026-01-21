import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { Check, Link as LinkIcon, UserPlus } from "lucide-react";

type TeamInviteActionsProps = {
  canManageMembers: boolean;
  copySuccess: boolean;
  isCreatingInviteLink: boolean;
  onOpenInviteDialog: () => void;
  onCreateInviteLink: () => void;
};

export function TeamInviteActions({
  canManageMembers,
  copySuccess,
  isCreatingInviteLink,
  onOpenInviteDialog,
  onCreateInviteLink,
}: TeamInviteActionsProps) {
  if (!canManageMembers) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pozovi nove članove</CardTitle>
        <CardDescription>
          Pozovite članove tima putem email-a ili podelite link za pozivnicu
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onOpenInviteDialog}>
          <UserPlus className="w-4 h-4 mr-2" />
          Pozovi putem email-a
        </Button>
        <Button variant="outline" onClick={onCreateInviteLink} disabled={isCreatingInviteLink}>
          {copySuccess ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Kopirano!
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              {isCreatingInviteLink ? "Kreiranje..." : "Kreiraj link za pozivnicu"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
