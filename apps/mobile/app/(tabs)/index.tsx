import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  FAB,
  MoreButton,
  SearchBar,
  uiStyles,
} from "@/components/ui/primitives";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Copy, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

export default function EventTypesScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState<{
    id: string;
    title: string;
    slug: string;
    hidden: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const eventsQuery = trpc.eventType.list.useQuery(undefined, { retry: false });
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });

  const toggleMutation = trpc.eventType.update.useMutation({
    onSuccess: async () => {
      await utils.eventType.list.invalidate();
    },
  });

  const deleteMutation = trpc.eventType.delete.useMutation({
    onSuccess: async () => {
      await utils.eventType.list.invalidate();
      setDeleteTarget(null);
    },
  });

  const salonSlug = meQuery.data?.salonSlug ?? meQuery.data?.salonName ?? "";

  const allItems = eventsQuery.data?.items ?? [];
  const items = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter((item: { title: string }) => item.title.toLowerCase().includes(q));
  }, [allItems, search]);

  const handleCopyLink = async (slug: string) => {
    const link = `${salonSlug}/${slug}`;
    await Clipboard.setStringAsync(link);
    Alert.alert("Kopirano", "Link za rezervaciju je kopiran.");
  };

  const sheetActions: BottomSheetAction[] = activeItem
    ? [
        {
          label: "Uredi",
          icon: <Pencil size={20} color={theme.colors.foreground} />,
          onPress: () => router.push(`/event-type/${activeItem.id}`),
        },
        {
          label: "Kopiraj link",
          icon: <Copy size={20} color={theme.colors.foreground} />,
          onPress: () => handleCopyLink(activeItem.slug),
        },
        {
          label: activeItem.hidden ? "Prikaži" : "Sakrij",
          icon: activeItem.hidden ? (
            <Eye size={20} color={theme.colors.foreground} />
          ) : (
            <EyeOff size={20} color={theme.colors.foreground} />
          ),
          onPress: () => toggleMutation.mutate({ id: activeItem.id, hidden: !activeItem.hidden }),
        },
        {
          label: "Obriši",
          icon: <Trash2 size={20} color={theme.colors.destructive} />,
          onPress: () => setDeleteTarget({ id: activeItem.id, title: activeItem.title }),
          destructive: true,
        },
      ]
    : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { gap: theme.spacing.md, marginBottom: theme.spacing.lg },
        listContent: { padding: theme.spacing.lg, paddingBottom: 140 },
        listItem: {
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: theme.spacing.md,
          gap: theme.spacing.md,
        },
        listItemContent: { flex: 1, gap: theme.spacing.xs },
        durationBadge: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceMuted,
        },
        hiddenBadge: { backgroundColor: `${theme.colors.destructive}10` },
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
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={eventsQuery.isRefetching}
            onRefresh={() => eventsQuery.refetch()}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="title">Usluge</AppText>
            <SearchBar value={search} onChangeText={setSearch} placeholder="Pretraži usluge" />
          </View>
        }
        ListEmptyComponent={
          eventsQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.centered}>
              <AppText variant="h2" centered>
                Nema usluga
              </AppText>
              <AppText variant="bodySm" centered muted>
                Kreirajte prvu uslugu koristeći + dugme.
              </AppText>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={styles.listItem} onPress={() => router.push(`/event-type/${item.id}`)}>
            <View style={styles.listItemContent}>
              <AppText variant="body" style={{ fontWeight: "500" }}>
                {item.title}
              </AppText>
              <View style={[uiStyles.row, { gap: theme.spacing.sm }]}>
                <View style={styles.durationBadge}>
                  <AppText variant="caption" muted>
                    {item.length} min
                  </AppText>
                </View>
                {item.hidden && (
                  <View style={[styles.durationBadge, styles.hiddenBadge]}>
                    <AppText variant="caption" style={{ color: theme.colors.destructive }}>
                      Skriveno
                    </AppText>
                  </View>
                )}
              </View>
            </View>
            <MoreButton
              onPress={() =>
                setActiveItem({
                  id: item.id,
                  title: item.title,
                  slug: item.slug,
                  hidden: item.hidden,
                })
              }
            />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FAB
        onPress={() => router.push("/event-type/new")}
        icon={<Plus size={20} color={theme.colors.primaryForeground} />}
      />

      <BottomSheet
        visible={!!activeItem}
        title={activeItem?.title}
        actions={sheetActions}
        onClose={() => setActiveItem(null)}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Obriši uslugu"
        message={`Da li ste sigurni da želite da obrišete "${deleteTarget?.title ?? ""}"?`}
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
