import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ConfirmDialog,
  SectionHeader,
} from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Plus } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type OOOFormData = {
  uuid?: string;
  startDate: Date;
  endDate: Date;
  reasonId?: string;
  notes: string;
};

const INITIAL_FORM: OOOFormData = {
  startDate: new Date(),
  endDate: new Date(Date.now() + 86400000),
  notes: "",
};

export default function OutOfOfficeScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<OOOFormData>(INITIAL_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const listQuery = trpc.outOfOffice.list.useQuery(undefined, { retry: false });
  const reasonsQuery = trpc.outOfOffice.reasons.useQuery(undefined, { retry: false });

  const createOrUpdateMutation = trpc.outOfOffice.createOrUpdate.useMutation({
    onSuccess: async () => {
      await utils.outOfOffice.list.invalidate();
      setShowForm(false);
      setFormData(INITIAL_FORM);
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

  const handleEdit = (item: any) => {
    setFormData({
      uuid: item.uuid,
      startDate: new Date(item.startDate),
      endDate: new Date(item.endDate),
      reasonId: item.reasonId ?? undefined,
      notes: item.notes ?? "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData(INITIAL_FORM);
    setShowForm(true);
  };

  const items = listQuery.data?.items ?? [];
  const reasons = reasonsQuery.data ?? [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: { flex: 1, backgroundColor: theme.colors.background },
        listContent: { padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 100 },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: theme.spacing.sm,
        },
        addButton: {
          backgroundColor: theme.colors.primary,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
        },
        centered: { paddingVertical: theme.spacing.xxl, alignItems: "center" },
        actions: { marginTop: theme.spacing.sm, flexDirection: "row", gap: theme.spacing.sm },
        modalContainer: { flex: 1, backgroundColor: theme.colors.background },
        modalHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        formContent: { padding: theme.spacing.lg, gap: theme.spacing.md },
        formGroup: { gap: theme.spacing.xs },
        dateButton: {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.md,
          backgroundColor: theme.colors.surface,
        },
        reasonRow: { flexDirection: "row", gap: theme.spacing.sm },
        multilineInput: { minHeight: 80, textAlignVertical: "top" },
      }),
    [theme]
  );

  return (
    <>
      <FlatList
        data={items}
        keyExtractor={(item) => item.uuid}
        style={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching}
            onRefresh={() => listQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <AppText variant="h2">Periodi odsustva</AppText>
            <Pressable style={styles.addButton} onPress={handleAdd}>
              <Plus size={20} color={theme.colors.primaryForeground} />
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centered}>
              <AppText variant="bodySm" centered muted>
                Nemate zakazanih perioda odsustva.
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => {
          const reason = reasons.find((r: any) => r.id === item.reasonId);
          return (
            <AppCard>
              <AppText variant="body">
                {new Date(item.startDate).toLocaleDateString("sr-RS")} —{" "}
                {new Date(item.endDate).toLocaleDateString("sr-RS")}
              </AppText>
              {reason && (
                <AppText variant="bodySm" muted>
                  {reason.emoji} {reason.reason}
                </AppText>
              )}
              {item.notes && (
                <AppText variant="caption" muted>
                  {item.notes}
                </AppText>
              )}
              <View style={styles.actions}>
                <AppButton label="Uredi" onPress={() => handleEdit(item)} variant="outline" />
                <AppButton
                  label="Obriši"
                  onPress={() => setDeleteTarget(item.uuid)}
                  variant="destructive"
                />
              </View>
            </AppCard>
          );
        }}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <AppText variant="h2">{formData.uuid ? "Uredi odsustvo" : "Novo odsustvo"}</AppText>
            <AppButton label="Zatvori" onPress={() => setShowForm(false)} variant="outline" />
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <AppText variant="bodySm">Početak</AppText>
              <Pressable style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
                <AppText variant="body">{formData.startDate.toLocaleDateString("sr-RS")}</AppText>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={formData.startDate}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    setShowStartPicker(Platform.OS === "ios");
                    if (date) {
                      setFormData((prev) => ({
                        ...prev,
                        startDate: date,
                        endDate: date > prev.endDate ? date : prev.endDate,
                      }));
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <AppText variant="bodySm">Kraj</AppText>
              <Pressable style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <AppText variant="body">{formData.endDate.toLocaleDateString("sr-RS")}</AppText>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={formData.endDate}
                  mode="date"
                  minimumDate={formData.startDate}
                  onChange={(_, date) => {
                    setShowEndPicker(Platform.OS === "ios");
                    if (date) setFormData((prev) => ({ ...prev, endDate: date }));
                  }}
                />
              )}
            </View>

            {reasons.length > 0 && (
              <View style={styles.formGroup}>
                <AppText variant="bodySm">Razlog</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.reasonRow}>
                    <AppButton
                      label="Bez razloga"
                      onPress={() => setFormData((p) => ({ ...p, reasonId: undefined }))}
                      variant={!formData.reasonId ? "primary" : "outline"}
                    />
                    {reasons.map((reason: any) => (
                      <AppButton
                        key={reason.id}
                        label={`${reason.emoji} ${reason.reason}`}
                        onPress={() => setFormData((p) => ({ ...p, reasonId: reason.id }))}
                        variant={formData.reasonId === reason.id ? "primary" : "outline"}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.formGroup}>
              <AppText variant="bodySm">Napomena</AppText>
              <AppInput
                value={formData.notes}
                onChangeText={(notes) => setFormData((p) => ({ ...p, notes }))}
                placeholder="Opcionalna napomena"
                multiline
                numberOfLines={3}
                style={styles.multilineInput}
              />
            </View>

            <AppButton
              label={formData.uuid ? "Sačuvaj" : "Dodaj odsustvo"}
              onPress={handleSubmit}
              loading={createOrUpdateMutation.isPending}
            />
          </ScrollView>
        </View>
      </Modal>

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
    </>
  );
}
