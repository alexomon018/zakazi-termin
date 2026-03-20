import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  InputDialog,
  QueryStateView,
  uiStyles,
} from "@/components/atoms";
import { TopBarPill } from "@/components/molecules";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import { formatTimeUTC } from "@salonko/config/date-formatters";
import { router } from "expo-router";
import { Copy, Globe, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

const DAY_NAMES_SHORT = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];

type ScheduleItem = {
  id: string;
  name: string;
  timeZone: string | null;
  availability: {
    id: string;
    days: number[];
    startTime: string | Date;
    endTime: string | Date;
  }[];
};

function getScheduleSummary(schedule: ScheduleItem) {
  if (!schedule.availability.length) return "Nema podešenih termina";

  const daySet = new Set<number>();
  let minStart = "23:59";
  let maxEnd = "00:00";

  for (const a of schedule.availability) {
    for (const d of a.days) daySet.add(d);
    const start = formatTimeUTC(a.startTime);
    const end = formatTimeUTC(a.endTime);
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }

  const days = [...daySet]
    .sort()
    .map((d) => DAY_NAMES_SHORT[d])
    .join(", ");

  return `${days} ${minStart} - ${maxEnd}`;
}

export default function AvailabilityScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [activeSchedule, setActiveSchedule] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const schedulesQuery = trpc.availability.listSchedules.useQuery(undefined, { retry: false });
  const meQuery = useMe();

  const createMutation = trpc.availability.createSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
      setCreateDialogVisible(false);
      setCreateName("");
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće kreirati raspored.");
    },
  });
  const deleteMutation = trpc.availability.deleteSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće obrisati raspored.");
      setDeleteTarget(null);
    },
  });
  const duplicateMutation = trpc.availability.duplicateSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće duplirati raspored.");
    },
  });
  const setDefaultMutation = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.availability.listSchedules.invalidate(),
        utils.user.me.invalidate(),
      ]);
    },
    onError: (error) => {
      Alert.alert("Greška", error.message || "Nije moguće postaviti podrazumevani raspored.");
    },
  });

  const defaultScheduleId = meQuery.data?.defaultScheduleId;
  const schedules = (schedulesQuery.data ?? []) as ScheduleItem[];
  const filtered = schedules;

  const sheetActions: BottomSheetAction[] = activeSchedule
    ? [
        {
          label: "Uredi",
          icon: <Pencil size={20} color={theme.colors.foreground} />,
          onPress: () => router.push(`/schedule/${activeSchedule.id}`),
        },
        ...(activeSchedule.id !== defaultScheduleId
          ? [
              {
                label: "Podrazumevani",
                icon: <Star size={20} color={theme.colors.foreground} />,
                onPress: () => setDefaultMutation.mutate({ scheduleId: activeSchedule.id }),
              },
            ]
          : []),
        {
          label: "Dupliraj",
          icon: <Copy size={20} color={theme.colors.foreground} />,
          onPress: () => duplicateMutation.mutate({ id: activeSchedule.id }),
        },
        ...(activeSchedule.id !== defaultScheduleId
          ? [
              {
                label: "Obriši",
                icon: <Trash2 size={20} color={theme.colors.destructive} />,
                onPress: () =>
                  setDeleteTarget({ id: activeSchedule.id, name: activeSchedule.name }),
                destructive: true,
              },
            ]
          : []),
      ]
    : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { paddingHorizontal: theme.spacing.lg },
        content: { padding: theme.spacing.lg, paddingBottom: 140, gap: theme.spacing.md },
        title: { marginBottom: theme.spacing.md },
        cardContainer: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          overflow: "hidden",
        },
        scheduleItem: {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 18,
          paddingVertical: 16,
          gap: theme.spacing.md,
        },
        scheduleContent: { flex: 1, gap: 3 },
        defaultBadge: {
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: theme.radius.full,
          borderWidth: 1,
          borderColor: theme.colors.primary,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginLeft: 18,
        },
        rowMoreButton: {
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        },
      }),
    [theme]
  );

  const renderContent = () => {
    if (schedulesQuery.isLoading) {
      return <QueryStateView state="loading" variant="inline" />;
    }

    if (schedulesQuery.isError) {
      return (
        <QueryStateView
          state="error"
          variant="inline"
          message={schedulesQuery.error?.message ?? "Povucite nadole da pokušate ponovo."}
        />
      );
    }

    if (filtered.length === 0) {
      return (
        <QueryStateView
          state="empty"
          variant="inline"
          title="Nema rasporeda"
          message="Kreirajte prvi raspored koristeći + dugme."
        />
      );
    }

    return (
      <View style={styles.cardContainer}>
        {filtered.map((item, index) => {
          const isDefault = item.id === defaultScheduleId;
          const summary = getScheduleSummary(item);
          const tz = item.timeZone ?? "Europe/Belgrade";

          return (
            <View key={item.id}>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                style={styles.scheduleItem}
                onPress={() => router.push(`/schedule/${item.id}`)}
              >
                <View style={styles.scheduleContent}>
                  <View style={[uiStyles.row, { gap: theme.spacing.sm }]}>
                    <AppText variant="body" style={{ fontWeight: "600" }}>
                      {item.name}
                    </AppText>
                    {isDefault && (
                      <View style={styles.defaultBadge}>
                        <AppText
                          variant="caption"
                          style={{ color: theme.colors.primary, fontWeight: "600" }}
                        >
                          Podrazumevani
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText variant="bodySm" muted>
                    {summary}
                  </AppText>
                  <View style={[uiStyles.row, { gap: theme.spacing.xs, marginTop: 2 }]}>
                    <Globe size={12} color={theme.colors.mutedForeground} />
                    <AppText variant="caption" muted>
                      {tz}
                    </AppText>
                  </View>
                </View>
                <Pressable
                  style={styles.rowMoreButton}
                  onPress={() => setActiveSchedule(item)}
                  accessibilityLabel="Open schedule actions"
                  accessibilityHint="Opens a menu with actions for this schedule"
                  accessibilityRole="button"
                >
                  <MoreHorizontal size={18} color={theme.colors.mutedForeground} />
                </Pressable>
              </Pressable>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <TopBarPill>
          <Pressable
            onPress={() => setCreateDialogVisible(true)}
            accessibilityLabel="Create schedule"
            accessibilityHint="Opens a dialog to create a new schedule"
            accessibilityRole="button"
          >
            <Plus size={22} color={theme.colors.foreground} />
          </Pressable>
        </TopBarPill>
        <AppText variant="title" style={styles.title}>
          Dostupnost
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={schedulesQuery.isRefetching}
            onRefresh={() => schedulesQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      <BottomSheet
        visible={!!activeSchedule}
        title={activeSchedule?.name}
        actions={sheetActions}
        onClose={() => setActiveSchedule(null)}
      />

      <InputDialog
        visible={createDialogVisible}
        title="Novi raspored"
        description="Kreirajte raspored za vaše radno vreme."
        placeholder="Naziv rasporeda"
        value={createName}
        onChangeText={setCreateName}
        confirmLabel="Kreiraj"
        loading={createMutation.isPending}
        onConfirm={() => {
          if (createName.trim()) {
            createMutation.mutate({ name: createName.trim() });
          }
        }}
        onCancel={() => {
          setCreateDialogVisible(false);
          setCreateName("");
        }}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Obriši raspored"
        message={`Da li ste sigurni da želite da obrišete "${deleteTarget?.name ?? ""}"?`}
        confirmLabel="Obriši"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate({ id: deleteTarget.id });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppScreen>
  );
}
