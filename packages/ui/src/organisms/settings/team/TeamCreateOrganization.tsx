"use client";

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
import { AlertCircle, Plus, Users } from "lucide-react";

type TeamCreateOrganizationProps = {
  orgName: string;
  isDialogOpen: boolean;
  isCreating: boolean;
  error?: string | null;
  onOrgNameChange: (value: string) => void;
  onDialogChange: (open: boolean) => void;
  onCreateOrganization: () => void;
};

export function TeamCreateOrganization({
  orgName,
  isDialogOpen,
  isCreating,
  error,
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

      {error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
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
            <Plus className="mr-2 w-4 h-4" />
            Kreiraj organizaciju
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={onDialogChange}>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (orgName.trim() && !isCreating) {
                onCreateOrganization();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Kreiraj organizaciju</DialogTitle>
              <DialogDescription>
                Unesite naziv vaše organizacije (salona). Možete ga kasnije promeniti.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
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
              <Button type="button" variant="outline" onClick={() => onDialogChange(false)}>
                Otkaži
              </Button>
              <Button type="submit" disabled={!orgName.trim() || isCreating}>
                {isCreating ? "Kreiranje..." : "Kreiraj"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
