import {
  AppButton,
  AppInput,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  FormField,
  QueryStateView,
  ScreenHeader,
} from "@/components/atoms";
import { DatePickerField, ModalPageHeader, OOOListItem } from "@/components/molecules";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useOOOForm } from "@/lib/use-ooo-form";
import { FlashList } from "@shopify/flash-list";
import { Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OutOfOfficeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<{
    uuid: string;
    start: string | Date;
    end: string | Date;
    reasonId?: string | null;
    notes?: string | null;
  } | null>(null);

  const {
    formData,
    setFormData,
    showStartPicker,
    showEndPicker,
    toggleStartPicker,
    toggleEndPicker,
    dismissStartPicker,
    dismissEndPicker,
    closeForm,
    resetForm,
    editForm,
  } = useOOOForm();

  const listQuery = trpc.outOfOffice.list.useQuery(undefined, { retry: false });
  const reasonsQuery = trpc.outOfOffice.reasons.useQuery(undefined, { retry: false });

  const createOrUpdateMutation = trpc.outOfOffice.createOrUpdate.useMutation({
    onSuccess: async () => {
      await utils.outOfOffice.list.invalidate();
      setShowForm(false);
      closeForm();
      resetForm();
    },
  });

  const deleteMutation = trpc.outOfOffice.delete.useMutation({
    onSuccess: async () => {
      await utils.outOfOffice.list.invalidate();
      setDeleteTarget(null);
    },
  });

  const handleSubmit = () => {
    createOrUpdateMutation.mutate({
      uuid: formData.uuid,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reasonId: formData.reasonId,
      notes: formData.notes || undefined,
    });
  };

  const handleEdit = (item: {
    uuid: string;
    start: string | Date;
    end: string | Date;
    reasonId?: string | null;
    notes?: string | null;
  }) => {
    editForm(item);
    setShowForm(true);
  };

  const handleAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    closeForm();
  };

  const items = listQuery.data?.entries ?? [];
  const reasons = reasonsQuery.data ?? [];

  const sheetActions: BottomSheetAction[] = activeItem
    ? [
        {
          label: "Uredi",
          icon: <Pencil size={20} color={theme.colors.foreground} />,
          onPress: () => handleEdit(activeItem),
        },
        {
          label: "Obriši",
          icon: <Trash2 size={20} color={theme.colors.destructive} />,
          onPress: () => setDeleteTarget(activeItem.uuid),
          destructive: true,
        },
      ]
    : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
        stickyHeader: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
          backgroundColor: theme.colors.background,
        },
        listContent: {
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.sm,
          paddingBottom: 100,
        },
        addButton: {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
        },
        modalContainer: { flex: 1, backgroundColor: theme.colors.background },
        formContent: { padding: theme.spacing.lg, gap: theme.spacing.md },
        reasonRow: { flexDirection: "row", gap: theme.spacing.sm },
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
      }),
    [theme, insets.top]
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => {
      const reason = reasons.find((r) => r.id === item.reasonId);
      return <OOOListItem item={item} reason={reason} onMorePress={() => setActiveItem(item)} />;
    },
    [reasons]
  );

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <ScreenHeader
          title="Odsustvo"
          rightContent={
            <Pressable
              style={styles.addButton}
              onPress={handleAdd}
              accessibilityRole="button"
              accessibilityLabel="Dodaj odsustvo"
              hitSlop={8}
            >
              <Plus size={20} color={theme.colors.primaryForeground} />
            </Pressable>
          }
        />
      </View>
      <FlashList
        data={items}
        keyExtractor={(item) => item.uuid}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={() => listQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          listQuery.isLoading ? (
            <QueryStateView state="loading" variant="inline" />
          ) : listQuery.isError ? (
            <QueryStateView
              state="error"
              variant="inline"
              message="Greška pri učitavanju perioda odsustva."
              onRetry={() => listQuery.refetch()}
            />
          ) : (
            <QueryStateView
              state="empty"
              variant="inline"
              title="Nema odsustva"
              message="Nemate zakazanih perioda odsustva."
            />
          )
        }
        renderItem={renderItem}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <View style={styles.modalContainer}>
          <ModalPageHeader
            title={formData.uuid ? "Uredi odsustvo" : "Novo odsustvo"}
            onClose={handleCloseForm}
          />

          <ScrollView contentContainerStyle={styles.formContent}>
            <DatePickerField
              label="Početak"
              value={formData.startDate}
              minimumDate={new Date()}
              showPicker={showStartPicker}
              onToggle={toggleStartPicker}
              onPickerDismiss={dismissStartPicker}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  startDate: date,
                  endDate: date > prev.endDate ? date : prev.endDate,
                }))
              }
            />

            <DatePickerField
              label="Kraj"
              value={formData.endDate}
              minimumDate={formData.startDate}
              showPicker={showEndPicker}
              onToggle={toggleEndPicker}
              onPickerDismiss={dismissEndPicker}
              onChange={(date) => setFormData((prev) => ({ ...prev, endDate: date }))}
            />

            {reasons.length > 0 && (
              <FormField label="Razlog">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.reasonRow}>
                    <AppButton
                      label="Bez razloga"
                      onPress={() => setFormData((p) => ({ ...p, reasonId: undefined }))}
                      variant={!formData.reasonId ? "primary" : "outline"}
                    />
                    {reasons.map((reason) => (
                      <AppButton
                        key={reason.id}
                        label={`${reason.emoji} ${reason.reason}`}
                        onPress={() => setFormData((p) => ({ ...p, reasonId: reason.id }))}
                        variant={formData.reasonId === reason.id ? "primary" : "outline"}
                      />
                    ))}
                  </View>
                </ScrollView>
              </FormField>
            )}

            <FormField label="Napomena">
              <AppInput
                value={formData.notes}
                onChangeText={(notes) => setFormData((p) => ({ ...p, notes }))}
                placeholder="Opcionalna napomena"
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </FormField>

            <AppButton
              label={formData.uuid ? "Sačuvaj" : "Dodaj odsustvo"}
              onPress={handleSubmit}
              loading={createOrUpdateMutation.isPending}
            />
          </ScrollView>
        </View>
      </Modal>

      <BottomSheet
        visible={!!activeItem}
        title="Opcije"
        actions={sheetActions}
        onClose={() => setActiveItem(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Obriši odsustvo"
        message="Da li ste sigurni da želite da obrišete ovaj period odsustva?"
        confirmLabel="Obriši"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ uuid: deleteTarget });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}
