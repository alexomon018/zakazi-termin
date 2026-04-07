import { AppCard, AppText, MoreButton } from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import type { Invite } from "@/components/organisms/team/types";

type InviteRowProps = {
  invite: Invite;
  roleLabel: string;
  onMorePress: () => void;
};

export function InviteRow({ invite, roleLabel, onMorePress }: InviteRowProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing.md,
        },
        info: {
          flex: 1,
          gap: 2,
        },
      }),
    [theme]
  );

  return (
    <AppCard>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="body">{invite.email ?? "Link za pozivnicu"}</AppText>
          <AppText variant="caption" muted>
            {roleLabel} · Ističe {new Date(invite.expiresAt).toLocaleDateString("sr-RS")}
          </AppText>
        </View>
        <MoreButton onPress={onMorePress} />
      </View>
    </AppCard>
  );
}
