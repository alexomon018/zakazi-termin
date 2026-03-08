import { AppScreen, AppText } from "@/components/atoms";
import { API_URL, WEB_ORIGIN } from "@/lib/api-url";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useMe } from "@/lib/use-me";
import * as Clipboard from "expo-clipboard";
import { type Href, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Calendar,
  ChevronRight,
  Copy,
  HelpCircle,
  LogOut,
  Palette,
  Plane,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useMemo } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type MenuItem = {
  id: string;
  href: Href;
  label: string;
  icon: LucideIcon;
};

const ACCOUNT_ITEMS: MenuItem[] = [
  {
    id: "appearance",
    href: "/setting/appearance",
    label: "Izgled",
    icon: Palette,
  },
];

const INTEGRATION_ITEMS: MenuItem[] = [
  {
    id: "calendar",
    href: "/setting/calendar",
    label: "Kalendar",
    icon: Calendar,
  },
];

const MANAGEMENT_ITEMS: MenuItem[] = [
  {
    id: "out-of-office",
    href: "/setting/out-of-office",
    label: "Odsustvo",
    icon: Plane,
  },
];

const TEAM_ITEM: MenuItem = {
  id: "team",
  href: "/setting/team",
  label: "Tim",
  icon: Users,
};

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { logout, user } = useAuth();
  const meQuery = useMe();

  const role = meQuery.data?.membership?.role;
  const hasMembership = !!meQuery.data?.membership;
  const showTeamMenu =
    !meQuery.isLoading && hasMembership && (role === "OWNER" || role === "ADMIN");

  const managementItems = useMemo(
    () => (showTeamMenu ? [...MANAGEMENT_ITEMS, TEAM_ITEM] : MANAGEMENT_ITEMS),
    [showTeamMenu]
  );

  const name = meQuery.data?.name ?? user?.name ?? "Korisnik";
  const email = meQuery.data?.email ?? user?.email ?? "";
  const avatarUrl = meQuery.data?.avatarUrl ?? user?.avatarUrl;
  const initial = name.charAt(0).toUpperCase();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          padding: theme.spacing.lg,
          gap: theme.spacing.lg,
          paddingBottom: 120,
        },
        title: { marginBottom: theme.spacing.md },
        profileRow: {
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
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
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
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border,
          gap: theme.spacing.md,
        },
        menuIconContainer: {
          width: 32,
          height: 32,
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: "center",
          justifyContent: "center",
        },
        logoutSection: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: "hidden",
        },
        logoutItem: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  const renderMenuGroup = (items: MenuItem[]) => (
    <View style={styles.menuSection}>
      {items.map((item, index) => (
        <Pressable
          key={item.id}
          style={[styles.menuItem, index === items.length - 1 && { borderBottomWidth: 0 }]}
          onPress={() => router.push(item.href)}
        >
          <View style={styles.menuIconContainer}>
            <item.icon size={18} color={theme.colors.foreground} />
          </View>
          <AppText variant="body" style={{ flex: 1, fontWeight: "500" }}>
            {item.label}
          </AppText>
          <ChevronRight size={16} color={theme.colors.mutedForeground} />
        </Pressable>
      ))}
    </View>
  );

  const salonSlug = meQuery.data?.salonSlug ?? "";

  const copyPublicLink = async () => {
    const safeSalonSlug = encodeURIComponent(salonSlug.replace(/\/+$/, ""));
    const link = `${WEB_ORIGIN}/${safeSalonSlug}`;
    await Clipboard.setStringAsync(link);
    Alert.alert("Kopirano", "Javni link je kopiran.");
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.title}>
          Podešavanja
        </AppText>
        <Pressable style={styles.profileRow} onPress={() => router.push("/setting/profile")}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
            ) : (
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: theme.colors.foreground,
                }}
              >
                {initial}
              </Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <AppText variant="body" style={{ fontWeight: "600" }}>
              {name}
            </AppText>
            <AppText variant="caption" muted>
              {email}
            </AppText>
          </View>
          <ChevronRight size={16} color={theme.colors.mutedForeground} />
        </Pressable>

        {renderMenuGroup(ACCOUNT_ITEMS)}
        {renderMenuGroup(INTEGRATION_ITEMS)}
        {renderMenuGroup(managementItems)}

        <View style={styles.menuSection}>
          <Pressable
            style={[styles.menuItem, { borderBottomWidth: StyleSheet.hairlineWidth }]}
            onPress={copyPublicLink}
          >
            <View style={styles.menuIconContainer}>
              <Copy size={18} color={theme.colors.foreground} />
            </View>
            <AppText variant="body" style={{ flex: 1, fontWeight: "500" }}>
              Kopiraj javni link
            </AppText>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => WebBrowser.openBrowserAsync(`${API_URL}/help`)}
          >
            <View style={styles.menuIconContainer}>
              <HelpCircle size={18} color={theme.colors.foreground} />
            </View>
            <AppText variant="body" style={{ flex: 1, fontWeight: "500" }}>
              Pomoć
            </AppText>
            <ChevronRight size={16} color={theme.colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Logout */}
        <View style={styles.logoutSection}>
          <Pressable style={styles.logoutItem} onPress={logout}>
            <LogOut size={18} color={theme.colors.destructive} />
            <AppText variant="body" style={{ color: theme.colors.destructive, fontWeight: "500" }}>
              Odjavite se
            </AppText>
          </Pressable>
        </View>

        <AppText variant="caption" muted centered>
          Salonko v1.0.0
        </AppText>
      </ScrollView>
    </AppScreen>
  );
}
