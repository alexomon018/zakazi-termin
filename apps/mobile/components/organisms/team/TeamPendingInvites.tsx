import { SectionHeader } from "@/components/atoms";
import { InviteRow } from "@/components/molecules";
import { useTheme } from "@/lib/theme-context";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { ROLE_LABELS } from "./constants";
import type { Invite } from "./types";

type TeamPendingInvitesProps = {
  invites: Invite[];
  onInvitePress: (invite: Invite) => void;
};

export function TeamPendingInvites({ invites, onInvitePress }: TeamPendingInvitesProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        list: {
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  if (invites.length === 0) return null;

  return (
    <>
      <SectionHeader title={`Pozivnice na čekanju (${invites.length})`} />
      <View style={styles.list}>
        {invites.map((invite) => (
          <InviteRow
            key={invite.inviteUrl}
            invite={invite}
            roleLabel={ROLE_LABELS[invite.role ?? "MEMBER"]}
            onMorePress={() => onInvitePress(invite)}
          />
        ))}
      </View>
    </>
  );
}
