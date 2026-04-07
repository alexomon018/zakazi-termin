"use client";

import { Button } from "@salonko/ui/atoms/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui/atoms/Dialog";
import { Input } from "@salonko/ui/atoms/Input";
import { Label } from "@salonko/ui/atoms/Label";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (confirmText: string) => void;
  isLoading?: boolean;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const handleConfirm = () => {
    onConfirm(confirmText);
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  const isValid = confirmText === "DELETE";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-red-600">Brisanje naloga</DialogTitle>
          </div>
          <DialogDescription>
            Ova akcija je nepovratna. Svi vaši podaci, uključujući termine, tipove termina i
            podešavanja, biće trajno obrisani.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Unesite <span className="font-mono font-bold">DELETE</span> da biste potvrdili
            </Label>
            <Input
              id="confirm-delete"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Odustani
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !isValid}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Brisanje..." : "Obriši nalog"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
