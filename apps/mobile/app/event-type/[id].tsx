import { AppButton, AppText, ConfirmDialog } from "@/components/atoms";
import {
  DEFAULT_FORM_DATA,
  EventTypeForm,
  type EventTypeFormData,
  validateEventTypeForm,
} from "@/components/organisms/EventTypeForm";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function EditEventTypeScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<EventTypeFormData>(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDelete, setShowDelete] = useState(false);

  const eventTypeQuery = trpc.eventType.byId.useQuery({ id: id! }, { retry: false, enabled: !!id });
  const schedulesQuery = trpc.availability.listSchedules.useQuery(undefined, {
    retry: false,
  });

  const updateMutation = trpc.eventType.update.useMutation({
    onSuccess: async () => {
      await utils.eventType.list.invalidate();
      router.back();
    },
    onError: (error) => {
      Alert.alert("Greška", error.message ?? "Čuvanje izmena nije uspelo.");
    },
  });

  const deleteMutation = trpc.eventType.delete.useMutation({
    onSuccess: async () => {
      await utils.eventType.list.invalidate();
      setShowDelete(false);
      router.back();
    },
    onError: (error) => {
      setShowDelete(false);
      Alert.alert("Greška", error.message ?? "Brisanje usluge nije uspelo.");
    },
  });

  useEffect(() => {
    if (eventTypeQuery.data) {
      const et = eventTypeQuery.data;
      const locations = (et.locations as any[] | null) ?? [];
      const inPersonLocation = locations.find((l: any) => l.type === "inPerson");
      const firstLocation = locations[0] as { type?: string } | undefined;
      setFormData({
        title: et.title,
        slug: et.slug,
        description: et.description ?? "",
        length: et.length,
        hidden: et.hidden,
        locationType: inPersonLocation
          ? "inPerson"
          : ((firstLocation?.type ?? "inPerson") as EventTypeFormData["locationType"]),
        locationAddress: inPersonLocation?.address ?? "",
        minimumBookingNotice: et.minimumBookingNotice ?? 120,
        beforeEventBuffer: et.beforeEventBuffer ?? 0,
        afterEventBuffer: et.afterEventBuffer ?? 0,
        requiresConfirmation: et.requiresConfirmation ?? false,
        scheduleId: et.scheduleId ?? null,
      });
    }
  }, [eventTypeQuery.data]);

  const handleSubmit = () => {
    const validationErrors = validateEventTypeForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const locations: { type: "inPerson"; address: string }[] = [];
    if (formData.locationType === "inPerson" && formData.locationAddress) {
      locations.push({ type: "inPerson", address: formData.locationAddress });
    }

    updateMutation.mutate({
      id: id!,
      title: formData.title,
      slug: formData.slug,
      description: formData.description || undefined,
      length: formData.length,
      hidden: formData.hidden,
      locations: locations.length > 0 ? locations : undefined,
      minimumBookingNotice: formData.minimumBookingNotice,
      beforeEventBuffer: formData.beforeEventBuffer,
      afterEventBuffer: formData.afterEventBuffer,
      requiresConfirmation: formData.requiresConfirmation,
      scheduleId: formData.scheduleId,
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
          gap: theme.spacing.md,
        },
        deleteContainer: {
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          backgroundColor: theme.colors.background,
        },
      }),
    [theme]
  );

  if (eventTypeQuery.isLoading || schedulesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (eventTypeQuery.error) {
    return (
      <View style={styles.centered}>
        <AppText variant="bodySm" muted centered>
          Nije moguće učitati uslugu.
        </AppText>
        <AppButton label="Nazad" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const schedules = (schedulesQuery.data ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <>
      <EventTypeForm
        formData={formData}
        errors={errors}
        schedules={schedules}
        isPending={updateMutation.isPending}
        submitLabel="Sačuvaj izmene"
        submitError={updateMutation.error?.message}
        showVisibilityToggle
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
      />
      <View style={styles.deleteContainer}>
        <AppButton
          label="Obriši uslugu"
          onPress={() => setShowDelete(true)}
          variant="destructive"
        />
      </View>
      <ConfirmDialog
        visible={showDelete}
        title="Obriši uslugu"
        message={`Da li ste sigurni da želite da obrišete "${formData.title}"? Ova akcija se ne može poništiti.`}
        confirmLabel="Obriši"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate({ id: id! })}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
