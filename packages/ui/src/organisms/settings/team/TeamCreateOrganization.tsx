import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@salonko/ui";
import { Plus, Users } from "lucide-react";

type TeamCreateOrganizationProps = {
  orgName: string;
  isDialogOpen: boolean;
  isCreating: boolean;
  onOrgNameChange: (value: string) => void;
  onDialogChange: (open: boolean) => void;
  onCreateOrganization: () => void;
};

export function TeamCreateOrganization({
  orgName,
  isDialogOpen,
  isCreating,
  onOrgNameChange,
  onDialogChange,
  onCreateOrganization,
}: TeamCreateOrganizationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tim</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Kreirajte organizaciju da biste dodali članove tima
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Kreirajte svoju organizaciju
          </CardTitle>
          <CardDescription>
            Organizacija vam omogućava da pozovete članove tima koji mogu upravljati terminima i
            rezervacijama.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => onDialogChange(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Kreiraj organizaciju
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kreiraj organizaciju</DialogTitle>
            <DialogDescription>
              Unesite naziv vaše organizacije (salona). Možete ga kasnije promeniti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Naziv organizacije</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => onOrgNameChange(e.target.value)}
                placeholder="Moj salon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onDialogChange(false)}>
              Otkaži
            </Button>
            <Button onClick={onCreateOrganization} disabled={!orgName.trim() || isCreating}>
              {isCreating ? "Kreiranje..." : "Kreiraj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
