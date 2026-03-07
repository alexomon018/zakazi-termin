import { ScreenHeader } from "@/components/atoms";
import { TeamSettingsClient } from "@/components/organisms/team";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TeamScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });
  const role = meQuery.data?.membership?.role;
  const isAuthorized = role === "OWNER" || role === "ADMIN";

  useEffect(() => {
    if (!meQuery.isLoading && !isAuthorized) {
      router.replace("/(tabs)/settings");
    }
  }, [meQuery.isLoading, isAuthorized]);

  if (meQuery.isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top + theme.spacing.sm,
      }}
    >
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <ScreenHeader title="Tim" />
      </View>
      <TeamSettingsClient />
    </View>
  );
}
