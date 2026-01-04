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

type CancelSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="cancel-subscription-dialog">
        <DialogHeader>
          <DialogTitle>Otkaži pretplatu</DialogTitle>
          <DialogDescription>
            Da li ste sigurni da želite da otkažete pretplatu? Vaša pretplata će ostati aktivna do
            kraja trenutnog perioda.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="dismiss-cancel-button"
          >
            Odustani
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            data-testid="confirm-cancel-button"
          >
            {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            {isPending ? "Otkazivanje..." : "Otkaži pretplatu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
