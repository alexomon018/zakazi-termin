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

type UpgradeToYearlyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
};

export function UpgradeToYearlyDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: UpgradeToYearlyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="upgrade-yearly-dialog">
        <DialogHeader>
          <DialogTitle>Nadogradnja na godišnji plan</DialogTitle>
          <DialogDescription>
            Da li želite da nadogradite na godišnji plan? Nova cena će stupiti na snagu na kraju
            trenutnog perioda naplate.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Odustani
          </Button>
          <Button onClick={onConfirm} disabled={isPending} data-testid="confirm-upgrade-button">
            {isPending ? <Loader2 className="mr-2 w-4 h-4 animate-spin" /> : null}
            {isPending ? "Nadogradnja..." : "Nadogradi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
