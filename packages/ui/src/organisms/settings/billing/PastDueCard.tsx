import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@salonko/ui";
import { Loader2 } from "lucide-react";

type PastDueCardProps = {
  onManagePayment: () => void;
  isManagingPayment: boolean;
};

export function PastDueCard({ onManagePayment, isManagingPayment }: PastDueCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ažurirajte način plaćanja</CardTitle>
        <CardDescription className="text-sm">
          Vaše plaćanje nije uspelo. Ažurirajte karticu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onManagePayment} disabled={isManagingPayment}>
          {isManagingPayment && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
          {isManagingPayment ? "Učitavanje..." : "Ažuriraj način plaćanja"}
        </Button>
      </CardContent>
    </Card>
  );
}
