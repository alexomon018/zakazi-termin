import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  ScreenHeader,
} from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import DateTimePicker from "@react-native-community/datetimepicker";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from "react-native-safe-area-context";

type OOOFormData = {
  uuid?: string;
  startDate: Date;
  endDate: Date;
  reasonId?: string;
  notes: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const createInitialForm = (): OOOFormData => ({
  startDate: new Date(),
  endDate: new Date(Date.now() + MS_PER_DAY),
  notes: "",
});

export default function OutOfOfficeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<OOOFormData>(createInitialForm);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<{
    uuid: string;
    start: string | Date;
    end: string | Date;
    reasonId?: string | null;
    notes?: string | null;
  } | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const animateLayout = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
  }, []);

  const toggleStartPicker = useCallback(() => {
    animateLayout();
    setShowStartPicker((v) => !v);
    if (!showStartPicker) {
      animateLayout();
      setShowEndPicker(false);
    }
  }, [showStartPicker, animateLayout]);

  const toggleEndPicker = useCallback(() => {
    animateLayout();
    setShowEndPicker((v) => !v);
    if (!showEndPicker) {
      animateLayout();
      setShowStartPicker(false);
    }
  }, [showEndPicker, animateLayout]);

  const closeForm = () => {
    setShowForm(false);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const listQuery = trpc.outOfOffice.list.useQuery(undefined, { retry: false });
  const reasonsQuery = trpc.outOfOffice.reasons.useQuery(undefined, { retry: false });

  const createOrUpdateMutation = trpc.outOfOffice.createOrUpdate.useMutation({
    onSuccess: async () => {
      await utils.outOfOffice.list.invalidate();
      closeForm();
      setFormData(createInitialForm());
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
    setFormData({
      uuid: item.uuid,
      startDate: new Date(item.start),
      endDate: new Date(item.end),
      reasonId: item.reasonId ?? undefined,
      notes: item.notes ?? "",
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setFormData(createInitialForm());
    setShowForm(true);
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
        list: { flex: 1, backgroundColor: theme.colors.background },
        listContent: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: insets.top + theme.spacing.sm,
          gap: theme.spacing.sm,
          paddingBottom: 100,
        },
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
        cardRow: { flexDirection: "row", alignItems: "center" },
        cardContent: { flex: 1, gap: 2 },
        moreButton: {
          width: 36,
          height: 36,
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border,
          alignItems: "center",
          justifyContent: "center",
          marginLeft: theme.spacing.sm,
        },
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
    [theme, insets.top]
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
          <>
            <ScreenHeader
              title="Odsustvo"
              rightContent={
                <Pressable style={styles.addButton} onPress={handleAdd}>
                  <Plus size={20} color={theme.colors.primaryForeground} />
                </Pressable>
              }
            />
            <AppText variant="h2" style={{ marginBottom: theme.spacing.sm }}>
              Periodi odsustva
            </AppText>
          </>
        }
        ListEmptyComponent={
          listQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : listQuery.isError ? (
            <View style={styles.centered}>
              <AppText variant="bodySm" centered muted>
                Greška pri učitavanju perioda odsustva.
              </AppText>
              <AppButton label="Pokušaj ponovo" onPress={() => listQuery.refetch()} />
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
          const reason = reasons.find((r) => r.id === item.reasonId);
          return (
            <AppCard>
              <View style={styles.cardRow}>
                <View style={styles.cardContent}>
                  <AppText variant="body">
                    {new Date(item.start).toLocaleDateString("sr-RS")} —{" "}
                    {new Date(item.end).toLocaleDateString("sr-RS")}
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
                </View>
                <Pressable
                  style={styles.moreButton}
                  onPress={() => setActiveItem(item)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Više opcija"
                >
                  <MoreHorizontal size={20} color={theme.colors.mutedForeground} />
                </Pressable>
              </View>
            </AppCard>
          );
        }}
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeForm}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <AppText variant="h2">{formData.uuid ? "Uredi odsustvo" : "Novo odsustvo"}</AppText>
            <AppButton label="Zatvori" onPress={closeForm} variant="outline" />
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <View style={styles.formGroup}>
              <AppText variant="bodySm">Početak</AppText>
              <Pressable style={styles.dateButton} onPress={toggleStartPicker}>
                <AppText variant="body">{formData.startDate.toLocaleDateString("sr-RS")}</AppText>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={formData.startDate}
                  mode="date"
                  display="inline"
                  minimumDate={new Date()}
                  onChange={(_, date) => {
                    if (Platform.OS !== "ios") {
                      animateLayout();
                      setShowStartPicker(false);
                    }
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
              <Pressable style={styles.dateButton} onPress={toggleEndPicker}>
                <AppText variant="body">{formData.endDate.toLocaleDateString("sr-RS")}</AppText>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={formData.endDate}
                  mode="date"
                  display="inline"
                  minimumDate={formData.startDate}
                  onChange={(_, date) => {
                    if (Platform.OS !== "ios") {
                      animateLayout();
                      setShowEndPicker(false);
                    }
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
    </>
  );
}
