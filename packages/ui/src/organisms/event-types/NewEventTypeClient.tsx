"use client";

import { trpc } from "@/lib/trpc/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../atoms/Button";
import {
  DEFAULT_FORM_DATA,
  EventTypeForm,
  type EventTypeFormData,
  type Schedule,
  buildLocationsArray,
  generateSlug,
  validateEventTypeForm,
} from "./EventTypeForm";

type NewEventTypeClientProps = {
  schedules: Schedule[];
};

export function NewEventTypeClient({ schedules }: NewEventTypeClientProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState<EventTypeFormData>(DEFAULT_FORM_DATA);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createEventType = trpc.eventType.create.useMutation({
    onSuccess: () => {
      utils.eventType.list.invalidate();
      router.push("/dashboard/event-types");
    },
    onError: (error: { message: string }) => {
      if (error.message.includes("Unique constraint")) {
        setErrors({ slug: "Ovaj slug već postoji. Izaberite drugi." });
      } else {
        setErrors({ form: error.message });
      }
    },
  });

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: slugManuallyEdited ? prev.slug : generateSlug(title),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors = validateEventTypeForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const locations = buildLocationsArray(formData);

    createEventType.mutate({
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      locations: locations.length > 0 ? locations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      slotInterval: formData.slotInterval || undefined,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId || undefined,
    });
  };

  return (
    <div className="mx-auto space-y-6 max-w-3xl">
      <div className="space-y-4">
        <Link
          href="/dashboard/event-types"
          className="inline-flex gap-2 items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          data-testid="event-type-back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Nazad na tipove termina</span>
        </Link>
        <div>
          <h1
            data-testid="create-event-type-title"
            className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white"
          >
            Novi tip termina
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400">
            Kreirajte novu vrstu termina za vaše klijente
          </p>
        </div>
      </div>

      <EventTypeForm
        formData={formData}
        errors={errors}
        schedules={schedules}
        isPending={createEventType.isPending}
        submitLabel="Kreiraj tip termina"
        pendingLabel="Kreiranje..."
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onTitleChange={handleTitleChange}
        onSlugChange={handleSlugChange}
      />
    </div>
  );
}
