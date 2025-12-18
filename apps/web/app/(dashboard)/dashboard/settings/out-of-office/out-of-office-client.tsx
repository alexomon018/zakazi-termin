"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@zakazi-termin/trpc";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@zakazi-termin/ui";
import { Check, AlertCircle, Plus, Trash2, Edit2, X, CalendarDays } from "lucide-react";
import { cn } from "@zakazi-termin/ui";

const outOfOfficeSchema = z.object({
  startDate: z.string().min(1, "Datum početka je obavezan"),
  endDate: z.string().min(1, "Datum završetka je obavezan"),
  reasonId: z.number().optional(),
  notes: z.string().optional(),
});

type OutOfOfficeFormValues = z.infer<typeof outOfOfficeSchema>;

type OutOfOfficeEntry = RouterOutputs["outOfOffice"]["list"]["entries"][number];
type Reason = RouterOutputs["outOfOffice"]["reasons"][number];

type OutOfOfficeClientProps = {
  initialEntries: RouterOutputs["outOfOffice"]["list"];
  initialReasons: Reason[];
};

export function OutOfOfficeClient({ initialEntries, initialReasons }: OutOfOfficeClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
      setShowModal(false);
      setEditingUuid(null);
      reset();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deleteEntry = trpc.outOfOffice.delete.useMutation({
    onSuccess: () => {
      utils.outOfOffice.list.invalidate();
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<OutOfOfficeFormValues>({
    resolver: zodResolver(outOfOfficeSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      reasonId: undefined,
      notes: "",
    },
  });

  const selectedReasonId = watch("reasonId");

  const onSubmit = (data: OutOfOfficeFormValues) => {
    createOrUpdate.mutate({
      uuid: editingUuid || undefined,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reasonId: data.reasonId,
      notes: data.notes,
    });
  };

  const handleEdit = (entry: OutOfOfficeEntry) => {
    setEditingUuid(entry.uuid);
    setValue("startDate", formatDateForInput(entry.start));
    setValue("endDate", formatDateForInput(entry.end));
    setValue("reasonId", entry.reasonId || undefined);
    setValue("notes", entry.notes || "");
    setShowModal(true);
  };

  const handleDelete = (uuid: string) => {
    if (confirm("Da li ste sigurni da želite da obrišete ovaj unos?")) {
      deleteEntry.mutate({ uuid });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUuid(null);
    reset();
  };

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const formatDateDisplay = (date: Date | string) => {
    return new Date(date).toLocaleDateString("sr-RS", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isActiveOrUpcoming = (end: Date | string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(end) >= today;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Van kancelarije</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upravljajte periodima kada niste dostupni za zakazivanje
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj period
        </Button>
      </div>

      {saved && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">Uspešno sačuvano!</span>
        </div>
      )}

      {createOrUpdate.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">{createOrUpdate.error.message}</span>
        </div>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vaši periodi odsustva</CardTitle>
        </CardHeader>
        <CardContent>
          {entries?.entries && entries.entries.length > 0 ? (
            <div className="space-y-3">
              {entries.entries.map((entry: OutOfOfficeEntry) => {
                const isActive = isActiveOrUpcoming(entry.end);
                return (
                  <div
                    key={entry.uuid}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border",
                      isActive
                        ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-xl",
                          isActive
                            ? "bg-orange-100 dark:bg-orange-900/30"
                            : "bg-gray-100 dark:bg-gray-700"
                        )}
                      >
                        {entry.reason?.emoji || "📅"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatDateDisplay(entry.start)} - {formatDateDisplay(entry.end)}
                          </p>
                          {isActive && new Date(entry.start) <= new Date() && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full">
                              Aktivno
                            </span>
                          )}
                        </div>
                        {entry.reason && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {entry.reason.reason}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.uuid)}
                        disabled={deleteEntry.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">Nemate zakazanih odsustva</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Dodajte period kada nećete biti dostupni za zakazivanje termina.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                {editingUuid ? "Izmeni period odsustva" : "Dodaj period odsustva"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-gray-900 dark:text-white">
                    Od
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register("startDate")}
                    min={formatDateForInput(new Date())}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-gray-900 dark:text-white">
                    Do
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...register("endDate")}
                    min={watch("startDate") || formatDateForInput(new Date())}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {reasons && reasons.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Razlog (opciono)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {reasons.map((reason: Reason) => (
                      <button
                        key={reason.id}
                        type="button"
                        onClick={() =>
                          setValue("reasonId", selectedReasonId === reason.id ? undefined : reason.id)
                        }
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                          selectedReasonId === reason.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                      >
                        <span className="text-xl">{reason.emoji}</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {reason.reason}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-900 dark:text-white">
                  Napomena (opciono)
                </Label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Dodatne informacije..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Otkaži
                </Button>
                <Button type="submit" disabled={createOrUpdate.isPending}>
                  {createOrUpdate.isPending
                    ? "Čuvanje..."
                    : editingUuid
                      ? "Sačuvaj izmene"
                      : "Dodaj"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
