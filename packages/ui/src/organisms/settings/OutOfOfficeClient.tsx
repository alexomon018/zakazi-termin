"use client";

import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@salonko/trpc";
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog } from "@salonko/ui";
import { AlertCircle, CalendarDays, Check, Plus } from "lucide-react";
import { useState } from "react";
import { formatLocalDateForInput } from "../../lib/utils/formatLocalDateForInput";
import {
  OutOfOfficeDialog,
  OutOfOfficeEntryItem,
  type OutOfOfficeFormValues,
} from "../../molecules/out-of-office";

type OutOfOfficeEntry = RouterOutputs["outOfOffice"]["list"]["entries"][number];
type Reason = RouterOutputs["outOfOffice"]["reasons"][number];

type OutOfOfficeClientProps = {
  initialEntries: RouterOutputs["outOfOffice"]["list"];
  initialReasons: Reason[];
};

export function OutOfOfficeClient({ initialEntries, initialReasons }: OutOfOfficeClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OutOfOfficeEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: entries } = trpc.outOfOffice.list.useQuery(undefined, {
    initialData: initialEntries,
  });

  const { data: reasons } = trpc.outOfOffice.reasons.useQuery(undefined, {
    initialData: initialReasons,
  });

  const createOrUpdate = trpc.outOfOffice.createOrUpdate.useMutation({
    onSuccess: () => {
      utils.outOfOffice.list.invalidate();
      setDialogOpen(false);
      setEditingEntry(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deleteEntry = trpc.outOfOffice.delete.useMutation({
    onSuccess: () => {
      utils.outOfOffice.list.invalidate();
    },
  });

  const handleSubmit = (data: OutOfOfficeFormValues) => {
    createOrUpdate.mutate({
      uuid: editingEntry?.uuid,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reasonId: data.reasonId,
      notes: data.notes,
    });
  };

  const handleEdit = (entry: OutOfOfficeEntry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleDelete = (uuid: string) => {
    setEntryToDelete(uuid);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry.mutate({ uuid: entryToDelete });
      setEntryToDelete(null);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  };

  const dialogEditingEntry = editingEntry
    ? {
        startDate: formatLocalDateForInput(editingEntry.start),
        endDate: formatLocalDateForInput(editingEntry.end),
        reasonId: editingEntry.reasonId || undefined,
        notes: editingEntry.notes || undefined,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Van kancelarije</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Upravljajte periodima kada niste dostupni za zakazivanje
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 w-4 h-4" />
          Dodaj period
        </Button>
      </div>

      {saved && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Uspesno sacuvano!</span>
        </div>
      )}

      {createOrUpdate.error && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{createOrUpdate.error.message}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vasi periodi odsustva</CardTitle>
        </CardHeader>
        <CardContent>
          {entries?.entries && entries.entries.length > 0 ? (
            <div className="space-y-3">
              {entries.entries.map((entry: OutOfOfficeEntry) => (
                <OutOfOfficeEntryItem
                  key={entry.uuid}
                  start={entry.start}
                  end={entry.end}
                  reason={entry.reason}
                  notes={entry.notes}
                  onEdit={() => handleEdit(entry)}
                  onDelete={() => handleDelete(entry.uuid)}
                  isDeleting={deleteEntry.isPending}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarDays className="mx-auto mb-4 w-12 h-12 text-gray-300 dark:text-gray-600" />
              <p className="mb-2 text-gray-500 dark:text-gray-400">Nemate zakazanih odsustva</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Dodajte period kada necete biti dostupni za zakazivanje termina.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <OutOfOfficeDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        onSubmit={handleSubmit}
        reasons={reasons || []}
        isLoading={createOrUpdate.isPending}
        editingEntry={dialogEditingEntry}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Obrisi period odsustva"
        description="Da li ste sigurni da zelite da obrisete ovaj unos?"
        confirmText="Obrisi"
        isLoading={deleteEntry.isPending}
      />
    </div>
  );
}
