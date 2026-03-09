import { QueryStateView, ScreenHeader } from "@/components/atoms";
import { TeamSettingsClient } from "@/components/organisms/team";
import { useTheme } from "@/lib/theme-context";
import { useMe } from "@/lib/use-me";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TeamScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const meQuery = useMe();
  const role = meQuery.data?.membership?.role;
  const isAuthorized = role === "OWNER" || role === "ADMIN";

  useEffect(() => {
    if (meQuery.isSuccess && !isAuthorized) {
      router.replace("/(tabs)/settings");
    }
  }, [meQuery.isSuccess, isAuthorized]);

  if (meQuery.isLoading) {
    return <QueryStateView state="loading" />;
  }

  if (meQuery.isError) {
    return <QueryStateView state="error" onRetry={() => meQuery.refetch()} />;
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
