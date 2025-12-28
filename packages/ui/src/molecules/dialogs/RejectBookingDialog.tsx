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
import { useState } from "react";

interface RejectBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  isLoading?: boolean;
}

export function RejectBookingDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: RejectBookingDialogProps) {
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
          <DialogTitle>Odbij termin</DialogTitle>
          <DialogDescription>
            Da li ste sigurni da želite da odbijete ovaj zahtev za termin?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Razlog odbijanja (opciono)</Label>
            <Input
              id="reject-reason"
              placeholder="Unesite razlog odbijanja..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Odustani
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? "Odbijanje..." : "Odbij termin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
