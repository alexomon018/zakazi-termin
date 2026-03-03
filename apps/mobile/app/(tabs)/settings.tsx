import { AppScreen, AppText } from "@/components/atoms";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { type Href, router } from "expo-router";
import { Calendar, ChevronRight, LogOut, Palette, Plane, User, Users } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

type MenuItem = {
  id: string;
  href: Href;
  label: string;
  icon: LucideIcon;
  description: string;
};

const BASE_MENU_ITEMS: MenuItem[] = [
  {
    id: "profile",
    href: "/setting/profile",
    label: "Profil",
    icon: User,
    description: "Ime, salon, bio",
  },
  {
    id: "appearance",
    href: "/setting/appearance",
    label: "Izgled",
    icon: Palette,
    description: "Tema i boje",
  },
  {
    id: "calendar",
    href: "/setting/calendar",
    label: "Kalendar",
    icon: Calendar,
    description: "Povezani kalendari",
  },
  {
    id: "out-of-office",
    href: "/setting/out-of-office",
    label: "Odsustvo",
    icon: Plane,
    description: "Periodi nedostupnosti",
  },
];

const TEAM_MENU_ITEM: MenuItem = {
  id: "team",
  href: "/setting/team",
  label: "Tim",
  icon: Users,
  description: "Upravljanje timom",
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });

  const role = meQuery.data?.membership?.role;
  const hasMembership = !!meQuery.data?.membership;
  const showTeamMenu =
    !meQuery.isLoading && hasMembership && (role === "OWNER" || role === "ADMIN");

  const menuItems = useMemo(
    () => (showTeamMenu ? [...BASE_MENU_ITEMS, TEAM_MENU_ITEM] : BASE_MENU_ITEMS),
    [showTeamMenu]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: 120,
        },
        profileCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        profileInfo: { flex: 1, gap: 2 },
        menuSection: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        },
        menuItem: {
          flexDirection: "row",
          alignItems: "center",
          padding: theme.spacing.lg,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          gap: theme.spacing.md,
        },
        menuIconContainer: {
          width: 36,
          height: 36,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        },
        menuContent: { flex: 1, gap: 2 },
        logoutButton: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.md,
        },
      }),
    [theme]
  );

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title">Više</AppText>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText variant="h2" style={{ color: theme.colors.primaryForeground }}>
              {(meQuery.data?.name ?? user?.name ?? "K").charAt(0).toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="body" style={{ fontWeight: "600" }}>
              {meQuery.data?.name ?? user?.name ?? "Korisnik"}
            </AppText>
            <AppText variant="bodySm" muted>
              {meQuery.data?.email ?? user?.email ?? ""}
            </AppText>
            {meQuery.data?.salonName && (
              <AppText variant="caption" muted>
                {meQuery.data.salonName}
              </AppText>
            )}
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => router.push(item.href)}
            >
              <View style={styles.menuIconContainer}>
                <item.icon size={20} color={theme.colors.foreground} />
              </View>
              <View style={styles.menuContent}>
                <AppText variant="body">{item.label}</AppText>
                <AppText variant="caption" muted>
                  {item.description}
                </AppText>
              </View>
              <ChevronRight size={18} color={theme.colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <LogOut size={18} color={theme.colors.destructive} />
          <AppText variant="body" style={{ color: theme.colors.destructive, fontWeight: "500" }}>
            Odjavite se
          </AppText>
        </Pressable>

        <AppText variant="caption" muted centered>
          Salonko v1.0.0
        </AppText>
      </ScrollView>
    </AppScreen>
  );
}
