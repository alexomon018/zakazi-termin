import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  FAB,
  InputDialog,
  MoreButton,
  SearchBar,
  uiStyles,
} from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { Copy, Globe, Pencil, Plus, Star, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

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

function formatTime(t: string | Date) {
  const d = new Date(t);
  return `${d.getUTCHours().toString().padStart(2, "0")}:${d.getUTCMinutes().toString().padStart(2, "0")}`;
}

function getScheduleSummary(schedule: ScheduleItem) {
  if (!schedule.availability.length) return "Nema podešenih termina";

  const daySet = new Set<number>();
  // formatTime returns zero-padded "HH:MM" strings, so lexicographic comparison
  // on minStart/maxEnd is valid as long as this format is preserved.
  let minStart = "23:59";
  let maxEnd = "00:00";

  for (const a of schedule.availability) {
    for (const d of a.days) daySet.add(d);
    const start = formatTime(a.startTime);
    const end = formatTime(a.endTime);
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
  const [search, setSearch] = useState("");
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [activeSchedule, setActiveSchedule] = useState<ScheduleItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const schedulesQuery = trpc.availability.listSchedules.useQuery(undefined, { retry: false });
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });

  const createMutation = trpc.availability.createSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
      setCreateDialogVisible(false);
      setCreateName("");
    },
  });
  const deleteMutation = trpc.availability.deleteSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
      setDeleteTarget(null);
    },
  });
  const duplicateMutation = trpc.availability.duplicateSchedule.useMutation({
    onSuccess: async () => {
      await utils.availability.listSchedules.invalidate();
    },
  });
  const setDefaultMutation = trpc.user.setDefaultSchedule.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.availability.listSchedules.invalidate(),
        utils.user.me.invalidate(),
      ]);
    },
  });

  const defaultScheduleId = meQuery.data?.defaultScheduleId;
  const schedules = (schedulesQuery.data ?? []) as ScheduleItem[];

  const filtered = useMemo(() => {
    if (!search.trim()) return schedules;
    const q = search.toLowerCase();
    return schedules.filter((s) => s.name.toLowerCase().includes(q));
  }, [schedules, search]);

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
        header: { gap: theme.spacing.md, marginBottom: theme.spacing.lg },
        listContent: { padding: theme.spacing.lg, paddingBottom: 140 },
        scheduleItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
        scheduleContent: { flex: 1, gap: 2 },
        defaultBadge: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.radius.full,
          backgroundColor: `${theme.colors.accent}10`,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: theme.spacing.xxl,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={schedulesQuery.isRefetching}
            onRefresh={() => schedulesQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title">Dostupnost</AppText>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Pretraži rasporede" />
          </View>
        }
        ListEmptyComponent={
          schedulesQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centered}>
              <AppText variant="h2" centered>
                Nema rasporeda
              </AppText>
              <AppText variant="bodySm" centered muted>
                Kreirajte prvi raspored koristeći + dugme.
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isDefault = item.id === defaultScheduleId;
          const summary = getScheduleSummary(item);
          const tz = item.timeZone ?? "Europe/Belgrade";

          return (
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
                        style={{ color: theme.colors.accent, fontWeight: "600" }}
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
              <MoreButton onPress={() => setActiveSchedule(item)} />
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FAB
        onPress={() => setCreateDialogVisible(true)}
        icon={<Plus size={20} color={theme.colors.primaryForeground} />}
      />

      <BottomSheet
        visible={!!activeSchedule}
        title={activeSchedule?.name}
        actions={sheetActions}
        onClose={() => setActiveSchedule(null)}
      />

      <InputDialog
        visible={createDialogVisible}
        title="Novi raspored"
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
