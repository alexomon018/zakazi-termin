import { AppCard, AppText, MoreButton } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import type { LucideIcon } from "lucide-react-native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { Member } from "@/components/organisms/team/types";

type MemberRowProps = {
  member: Member;
  isCurrentUser: boolean;
  roleLabel: string;
  roleIcon: LucideIcon;
  hasActions: boolean;
  onMorePress: () => void;
};

export function MemberRow({
  member,
  isCurrentUser,
  roleLabel,
  roleIcon: RoleIcon,
  hasActions,
  onMorePress,
}: MemberRowProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        avatar: {
          width: 40,
          height: 40,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
        info: {
          flex: 1,
          gap: 2,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        youBadge: {
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 2,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.primary,
          marginLeft: theme.spacing.xs,
        },
        roleBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: 4,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surfaceMuted,
          alignSelf: "flex-start",
        },
      }),
    [theme]
  );

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <AppText
            variant="body"
            style={{ color: theme.colors.primaryForeground, fontWeight: "600" }}
          >
            {(member.name ?? member.email).charAt(0).toUpperCase()}
          </AppText>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <AppText variant="body" style={{ fontWeight: "600" }}>
              {member.name ?? member.email}
            </AppText>
            {isCurrentUser && (
              <View style={styles.youBadge}>
                <AppText variant="caption" style={{ color: theme.colors.primaryForeground }}>
                  Vi
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" muted>
            {member.email}
          </AppText>
          <View style={styles.roleBadge}>
            <RoleIcon size={12} color={theme.colors.mutedForeground} />
            <AppText variant="caption" muted>
              {roleLabel}
            </AppText>
          </View>
        </View>
        {hasActions && <MoreButton onPress={onMorePress} />}
      </View>
    </AppCard>
  );
}
