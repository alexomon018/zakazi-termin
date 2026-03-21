import { QueryStateView, ScreenHeader } from "@/components/atoms";
import { TeamSettingsClient } from "@/components/organisms/team";
import { useTheme } from "@/lib/theme-context";
import { useRoleGuard } from "@/lib/use-role-guard";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TeamScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthorized, isLoading } = useRoleGuard({
    allowedRoles: ["OWNER", "ADMIN"],
  });

  if (isLoading) {
    return <QueryStateView state="loading" />;
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
