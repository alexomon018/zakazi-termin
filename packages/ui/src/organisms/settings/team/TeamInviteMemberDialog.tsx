import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salonko/ui";
import { roleLabels } from "./constants";

type TeamInviteMemberDialogProps = {
  open: boolean;
  currentUserRole: string | undefined;
  inviteEmail: string;
  inviteRole: "ADMIN" | "MEMBER";
  isInviting: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailChange: (value: string) => void;
  onRoleChange: (role: "ADMIN" | "MEMBER") => void;
  onInvite: () => void;
};

export function TeamInviteMemberDialog({
  open,
  currentUserRole,
  inviteEmail,
  inviteRole,
  isInviting,
  onOpenChange,
  onEmailChange,
  onRoleChange,
  onInvite,
}: TeamInviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pozovi člana tima</DialogTitle>
          <DialogDescription>
            Pošaljite pozivnicu putem email-a. Novi član će moći da se registruje i pristupi timu.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email adresa</Label>
            <Input
              id="email"
              type="email"
              value={inviteEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="ime@primer.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Uloga</Label>
            <Select value={inviteRole} onValueChange={(v) => onRoleChange(v as "ADMIN" | "MEMBER")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">{roleLabels.MEMBER}</SelectItem>
                {currentUserRole === "OWNER" && (
                  <SelectItem value="ADMIN">{roleLabels.ADMIN}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {inviteRole === "ADMIN"
                ? "Administratori mogu pozivati i uklanjati članove."
                : "Članovi mogu upravljati svojim rasporedom i terminima."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Otkaži
          </Button>
          <Button onClick={onInvite} disabled={!inviteEmail.trim() || isInviting}>
            {isInviting ? "Slanje..." : "Pošalji pozivnicu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
