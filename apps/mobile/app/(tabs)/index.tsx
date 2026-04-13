import {
  AppScreen,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  FAB,
  FadeSlideIn,
  InfoDialog,
  QueryStateView,
} from "@/components/atoms";
import { TopBarPill } from "@/components/molecules";
import { SubscriptionGate } from "@/components/organisms/SubscriptionGate";
import { WEB_ORIGIN } from "@/lib/api-url";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { useMe } from "@/lib/use-me";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Clock, Copy, Eye, EyeOff, Menu, Pencil, Plus, Trash2, User } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function EventTypesScreen() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();
  const [activeItem, setActiveItem] = useState<{
    id: string;
    title: string;
    slug: string;
    hidden: boolean;
    isOwner: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const eventsQuery = trpc.eventType.list.useQuery(undefined, { retry: false });
  const meQuery = useMe();

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

  const salonSlug = meQuery.data?.salonSlug ?? "";

  const [infoDialog, setInfoDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const items = eventsQuery.data?.items ?? [];

  const handleCopyLink = async (slug: string) => {
    if (!salonSlug) {
      setInfoDialog({
        title: "Informacija",
        message: "Javni link još nije dostupan.",
      });
      return;
    }
    const safeSalonSlug = encodeURIComponent(salonSlug.replace(/\/+$/, ""));
    const safeSlug = encodeURIComponent(slug);
    const link = `${WEB_ORIGIN}/${safeSalonSlug}/${safeSlug}`;
    await Clipboard.setStringAsync(link);
    setInfoDialog({
      title: "Kopirano",
      message: "Link za rezervaciju je kopiran.",
    });
  };

  const sheetActions: BottomSheetAction[] = activeItem
    ? [
        ...(activeItem.isOwner
          ? [
              {
                label: "Uredi",
                icon: <Pencil size={20} color={theme.colors.foreground} />,
                onPress: () => router.push(`/event-type/${activeItem.id}`),
              },
            ]
          : []),
        {
          label: "Kopiraj link",
          icon: <Copy size={20} color={theme.colors.foreground} />,
          onPress: () => handleCopyLink(activeItem.slug),
        },
        ...(activeItem.isOwner
          ? [
              {
                label: activeItem.hidden ? "Prikaži" : "Sakrij",
                icon: activeItem.hidden ? (
                  <Eye size={20} color={theme.colors.foreground} />
                ) : (
                  <EyeOff size={20} color={theme.colors.foreground} />
                ),
                onPress: () => {
                  if (toggleMutation.isPending) return;
                  toggleMutation.mutate({
                    id: activeItem.id,
                    hidden: !activeItem.hidden,
                  });
                },
              },
              {
                label: "Obriši",
                icon: <Trash2 size={20} color={theme.colors.destructive} />,
                onPress: () => setDeleteTarget({ id: activeItem.id, title: activeItem.title }),
                destructive: true,
              },
            ]
          : []),
      ]
    : [];

  const TAB_BAR_BOTTOM_PADDING = 100;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: TAB_BAR_BOTTOM_PADDING,
          gap: theme.spacing.md,
        },
        title: { marginBottom: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
        cardContainer: {
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          overflow: "hidden",
        },
        listItem: {
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 18,
          paddingVertical: 16,
          gap: theme.spacing.md,
        },
        listItemContent: { flex: 1, gap: 5 },
        badgeRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 4,
        },
        badge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surfaceMuted,
        },
        hiddenBadge: {
          borderColor: theme.colors.destructive,
          backgroundColor: `${theme.colors.destructive}15`,
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
    if (eventsQuery.isLoading) {
      return <QueryStateView state="loading" variant="inline" />;
    }

    if (eventsQuery.isError && items.length === 0) {
      return (
        <QueryStateView
          state="error"
          variant="inline"
          message="Došlo je do greške prilikom učitavanja usluga."
          onRetry={() => eventsQuery.refetch()}
        />
      );
    }

    if (items.length === 0) {
      return (
        <QueryStateView
          state="empty"
          variant="inline"
          title="Nema usluga"
          message="Kreirajte prvu uslugu koristeći + dugme."
        />
      );
    }

    return (
      <View style={styles.cardContainer}>
        {items.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <View style={styles.separator} />}
            <View style={styles.listItem}>
              <Pressable
                style={styles.listItemContent}
                onPress={() => router.push(`/event-type/${item.id}`)}
              >
                <AppText variant="body" style={{ fontWeight: "600" }}>
                  {item.title}
                </AppText>
                {salonSlug && (
                  <AppText variant="bodySm" muted>
                    {salonSlug}/{item.slug}
                  </AppText>
                )}
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Clock size={12} color={theme.colors.mutedForeground} />
                    <AppText variant="bodySm" style={{ fontWeight: "600" }}>
                      {item.length}m
                    </AppText>
                  </View>
                  {item.hidden && (
                    <View style={[styles.badge, styles.hiddenBadge]}>
                      <EyeOff size={12} color={theme.colors.destructive} />
                      <AppText
                        variant="bodySm"
                        style={{
                          fontWeight: "500",
                          color: theme.colors.destructive,
                        }}
                      >
                        Skriveno
                      </AppText>
                    </View>
                  )}
                  {item.ownerName && (
                    <View style={styles.badge}>
                      <User size={12} color={theme.colors.mutedForeground} />
                      <AppText variant="bodySm" muted style={{ fontWeight: "500" }}>
                        {item.ownerName}
                      </AppText>
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable
                style={styles.rowMoreButton}
                accessibilityRole="button"
                accessibilityLabel={`Otvori meni za ${item.title}`}
                accessibilityHint="Otvara akcije za ovu uslugu"
                onPress={() =>
                  setActiveItem({
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    hidden: item.hidden,
                    isOwner: item.isOwner,
                  })
                }
              >
                <Menu size={18} color={theme.colors.mutedForeground} accessible={false} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SubscriptionGate>
      <AppScreen>
        <FadeSlideIn style={{ flex: 1 }}>
          <InfoDialog
            visible={!!infoDialog}
            title={infoDialog?.title ?? ""}
            message={infoDialog?.message ?? ""}
            onClose={() => setInfoDialog(null)}
          />
          <AppText variant="title" style={styles.title}>
            Moje usluge
          </AppText>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={eventsQuery.isRefetching}
                onRefresh={() => eventsQuery.refetch()}
                tintColor={theme.colors.primary}
              />
            }
          >
            {renderContent()}
          </ScrollView>

          <FAB
            onPress={() => router.push("/event-type/new")}
            icon={<Plus size={28} color={theme.colors.primaryForeground} />}
            accessibilityLabel="Novi tip termina"
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
        </FadeSlideIn>
      </AppScreen>
    </SubscriptionGate>
  );
}
