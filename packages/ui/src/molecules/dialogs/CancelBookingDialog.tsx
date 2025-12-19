"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../atoms/Dialog";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason || undefined);
    setReason("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Otkaži termin</DialogTitle>
          <DialogDescription>
            Da li ste sigurni da želite da otkažete ovaj termin?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Razlog otkazivanja (opciono)</Label>
            <Input
              id="cancel-reason"
              placeholder="Unesite razlog otkazivanja..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Odustani
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Otkazivanje..." : "Otkaži termin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
