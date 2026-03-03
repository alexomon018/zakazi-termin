import {
  DEFAULT_FORM_DATA,
  EventTypeForm,
  type EventTypeFormData,
  validateEventTypeForm,
} from "@/components/organisms/EventTypeForm";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );

  if (schedulesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const schedules = (schedulesQuery.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <EventTypeForm
      formData={formData}
      errors={errors}
      schedules={schedules}
      isPending={createMutation.isPending}
      submitLabel="Kreiraj uslugu"
      submitError={createMutation.error?.message}
      onFormDataChange={setFormData}
      onSubmit={handleSubmit}
    />
  );
}
