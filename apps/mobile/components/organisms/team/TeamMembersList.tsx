import { SectionHeader } from "@/components/atoms";
import { MemberRow } from "@/components/molecules";
import { useTheme } from "@/lib/theme-context";
import { Users } from "lucide-react-native";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ROLE_ICONS, ROLE_LABELS } from "./constants";
import type { Member } from "./types";

type TeamMembersListProps = {
  members: Member[];
  currentUserId: string | undefined;
  isLoading: boolean;
  getMemberActions: (member: Member) => { length: number };
  onMemberPress: (member: Member) => void;
};

export function TeamMembersList({
  members,
  currentUserId,
  isLoading,
  getMemberActions,
  onMemberPress,
}: TeamMembersListProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        centered: {
          paddingVertical: theme.spacing.xl,
          alignItems: "center",
        },
        list: {
          gap: theme.spacing.sm,
        },
      }),
    [theme]
  );

  return (
    <>
      <SectionHeader title={`Članovi tima (${members.length})`} />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.list}>
          {members.map((member) => {
            const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS] ?? Users;
            const actions = getMemberActions(member);
            return (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                roleLabel={ROLE_LABELS[member.role] ?? member.role}
                roleIcon={RoleIcon}
                hasActions={actions.length > 0}
                onMorePress={() => onMemberPress(member)}
              />
            );
          })}
        </View>
      )}
    </>
  );
}
