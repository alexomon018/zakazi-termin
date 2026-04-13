import { QueryStateView } from "@/components/atoms";
import {
  DEFAULT_FORM_DATA,
  EventTypeForm,
  type EventTypeFormData,
  validateEventTypeForm,
} from "@/components/organisms/EventTypeForm";
import { SubscriptionGate } from "@/components/organisms/SubscriptionGate";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";

export default function NewEventTypeScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<EventTypeFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const schedulesQuery = trpc.availability.listSchedules.useQuery(undefined, {
    retry: false,
  });

  const createMutation = trpc.eventType.create.useMutation({
    onSuccess: async () => {
      await utils.eventType.list.invalidate();
      router.back();
    },
  });

  const handleSubmit = () => {
    const validationErrors = validateEventTypeForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const locations: { type: "inPerson"; address: string }[] = [];
    if (formData.locationType === "inPerson" && formData.locationAddress) {
      locations.push({ type: "inPerson", address: formData.locationAddress });
    }

    createMutation.mutate({
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      locations: locations.length > 0 ? locations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId ?? undefined,
    });
  };

  if (schedulesQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  const schedules = (schedulesQuery.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <SubscriptionGate>
      <EventTypeForm
        formData={formData}
        errors={errors}
        schedules={schedules}
        isPending={createMutation.isPending}
        submitLabel="Kreiraj"
        submitError={createMutation.error?.message}
        headerTitle="Nova usluga"
        onBackPress={() => router.back()}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />
    </SubscriptionGate>
  );
}
