"use client";

import { Button, Card, CardContent, CardHeader, CardTitle, DeleteAccountDialog } from "@salonko/ui";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";

type DangerZoneCardProps = {
  onDeleteAccount: (confirmText: string) => void;
  isDeleting: boolean;
  deleteError: string | null;
};

export function DangerZoneCard({ onDeleteAccount, isDeleting, deleteError }: DangerZoneCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <div className="flex gap-2 items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Opasna zona</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Jednom kada obrišete nalog, nema povratka. Molimo budite sigurni.
          </p>
          <Button
            type="button"
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Obriši nalog
          </Button>
          {deleteError && (
            <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-300">{deleteError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={onDeleteAccount}
        isLoading={isDeleting}
      />
    </>
  );
}
