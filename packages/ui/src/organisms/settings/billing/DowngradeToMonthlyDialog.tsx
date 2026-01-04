import { Button } from "@salonko/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@salonko/ui/atoms/Dialog";
import { Loader2 } from "lucide-react";

type DowngradeToMonthlyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function DowngradeToMonthlyDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: DowngradeToMonthlyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="downgrade-monthly-dialog">
        <DialogHeader>
          <DialogTitle>Prelazak na mesečni plan</DialogTitle>
          <DialogDescription>
            Da li želite da pređete na mesečni plan? Nova cena će stupiti na snagu na kraju
            trenutnog perioda naplate.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Odustani
          </Button>
          <Button onClick={onConfirm} disabled={isPending} data-testid="confirm-downgrade-button">
            {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            {isPending ? "Promena..." : "Pređi na mesečni"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
