import {
  AppButton,
  AppCard,
  AppText,
  BottomSheet,
  type BottomSheetAction,
  ConfirmDialog,
  SectionHeader,
} from "@/components/atoms";
import { useTheme } from "@/lib/theme-context";
import { trpc } from "@/lib/trpc";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { Copy, LogOut, RefreshCw, Shield, Trash2, UserMinus, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";

import { TeamEmptyState } from "./TeamEmptyState";
import { TeamInviteActions } from "./TeamInviteActions";
import { TeamInviteMemberModal } from "./TeamInviteMemberModal";
import { TeamMembersList } from "./TeamMembersList";
import { TeamPendingInvites } from "./TeamPendingInvites";
import { ROLE_LABELS } from "./constants";
import type { Invite, Member } from "./types";

export function TeamSettingsClient() {
  const { theme } = useTheme();
  const utils = trpc.useUtils();

  // --- Queries ---
  const meQuery = trpc.user.me.useQuery(undefined, { retry: false });
  const orgQuery = trpc.organization.get.useQuery(undefined, { retry: false });

  const organizationId = orgQuery.data?.id ?? "";
  const currentUserRole = orgQuery.data?.role;
  const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canChangeRoles = currentUserRole === "OWNER";
  const currentUserId = meQuery.data?.id;

  const membersQuery = trpc.team.listMembers.useQuery(
    { organizationId },
    { enabled: !!organizationId, retry: false }
  );

  const invitesQuery = trpc.team.listInvites.useQuery(
    { organizationId },
    { enabled: !!organizationId && canManageMembers, retry: false }
  );

  // --- State ---
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [memberSheetOpen, setMemberSheetOpen] = useState(false);
  const [roleChangeSheetOpen, setRoleChangeSheetOpen] = useState(false);

  const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);

  const [confirmRemoveMember, setConfirmRemoveMember] = useState(false);
  const [confirmDeleteInvite, setConfirmDeleteInvite] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // --- Mutations ---
  const createOrgMutation = trpc.organization.create.useMutation({
    onSuccess: () => utils.organization.get.invalidate(),
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const inviteMemberMutation = trpc.team.inviteMember.useMutation({
    onSuccess: async () => {
      await utils.team.listInvites.invalidate();
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const createInviteLinkMutation = trpc.team.createInviteLink.useMutation({
    onSuccess: async (result) => {
      await utils.team.listInvites.invalidate();
      await Clipboard.setStringAsync(result.inviteLink);
      Alert.alert("Kopirano", "Link za pozivnicu je kopiran u clipboard.");
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const changeMemberRoleMutation = trpc.team.changeMemberRole.useMutation({
    onSuccess: async () => {
      await utils.team.listMembers.invalidate();
      setRoleChangeSheetOpen(false);
      setActiveMember(null);
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const removeMemberMutation = trpc.team.removeMember.useMutation({
    onSuccess: async () => {
      await utils.team.listMembers.invalidate();
      setConfirmRemoveMember(false);
      setActiveMember(null);
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const leaveMutation = trpc.team.leave.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.organization.get.invalidate(), utils.team.listMembers.invalidate()]);
      setConfirmLeave(false);
      router.back();
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const resendInviteMutation = trpc.team.resendInvite.useMutation({
    onSuccess: () => Alert.alert("Poslato", "Pozivnica je ponovo poslata."),
    onError: (error) => Alert.alert("Greška", error.message),
  });

  const deleteInviteMutation = trpc.team.deleteInvite.useMutation({
    onSuccess: async () => {
      await utils.team.listInvites.invalidate();
      setConfirmDeleteInvite(false);
      setActiveInvite(null);
    },
    onError: (error) => Alert.alert("Greška", error.message),
  });

  // --- BottomSheet actions ---
  const getMemberActions = (member: Member): BottomSheetAction[] => {
    const isCurrentUser = member.userId === currentUserId;
    const actions: BottomSheetAction[] = [];

    if (isCurrentUser && currentUserRole !== "OWNER") {
      actions.push({
        label: "Napusti organizaciju",
        icon: <LogOut size={20} color={theme.colors.destructive} />,
        destructive: true,
        onPress: () => setConfirmLeave(true),
      });
      return actions;
    }

    if (canChangeRoles && !isCurrentUser && member.role !== "OWNER") {
      actions.push({
        label: "Promeni ulogu",
        icon: <Shield size={20} color={theme.colors.foreground} />,
        onPress: () => setRoleChangeSheetOpen(true),
      });
    }

    const canRemove =
      canManageMembers &&
      !isCurrentUser &&
      member.role !== "OWNER" &&
      (currentUserRole === "OWNER" || member.role === "MEMBER");

    if (canRemove) {
      actions.push({
        label: "Ukloni člana",
        icon: <UserMinus size={20} color={theme.colors.destructive} />,
        destructive: true,
        onPress: () => setConfirmRemoveMember(true),
      });
    }

    return actions;
  };

  const getInviteActions = (invite: Invite): BottomSheetAction[] => {
    const actions: BottomSheetAction[] = [];

    if (invite.email) {
      actions.push({
        label: "Ponovo pošalji",
        icon: <RefreshCw size={20} color={theme.colors.foreground} />,
        onPress: () => {
          if (invite.email) {
            resendInviteMutation.mutate({ organizationId, email: invite.email });
          }
        },
      });
    } else {
      actions.push({
        label: "Kopiraj link",
        icon: <Copy size={20} color={theme.colors.foreground} />,
        onPress: async () => {
          await Clipboard.setStringAsync(invite.inviteUrl);
          Alert.alert("Kopirano", "Link je kopiran.");
        },
      });
    }

    actions.push({
      label: "Obriši pozivnicu",
      icon: <Trash2 size={20} color={theme.colors.destructive} />,
      destructive: true,
      onPress: () => setConfirmDeleteInvite(true),
    });

    return actions;
  };

  const roleChangeActions: BottomSheetAction[] = activeMember
    ? [
        {
          label: "Administrator",
          icon: <Shield size={20} color={theme.colors.foreground} />,
          disabled: activeMember.role === "ADMIN",
          onPress: () =>
            changeMemberRoleMutation.mutate({
              organizationId,
              memberId: activeMember.id,
              role: "ADMIN" as const,
            }),
        },
        {
          label: "Član",
          icon: <Users size={20} color={theme.colors.foreground} />,
          disabled: activeMember.role === "MEMBER",
          onPress: () =>
            changeMemberRoleMutation.mutate({
              organizationId,
              memberId: activeMember.id,
              role: "MEMBER" as const,
            }),
        },
      ]
    : [];

  // --- Styles ---
  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollView: { flex: 1, backgroundColor: theme.colors.background },
        content: {
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: 100,
        },
        centered: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        },
        orgHeader: {
          gap: theme.spacing.xs,
        },
      }),
    [theme]
  );

  // --- Loading / Error ---
  if (orgQuery.isLoading || meQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (orgQuery.isError) {
    return (
      <View style={styles.centered}>
        <AppText variant="bodySm" centered muted>
          Greška pri učitavanju podataka.
        </AppText>
        <AppButton label="Pokušaj ponovo" onPress={() => orgQuery.refetch()} />
      </View>
    );
  }

  // --- No organization ---
  if (!orgQuery.data) {
    return (
      <TeamEmptyState
        salonName={meQuery.data?.salonName ?? null}
        isCreating={createOrgMutation.isPending}
        onCreate={(name) => createOrgMutation.mutate({ name })}
      />
    );
  }

  // --- Has organization ---
  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Org header */}
        <AppCard>
          <View style={styles.orgHeader}>
            <AppText variant="h2">{orgQuery.data.name}</AppText>
            <AppText variant="caption" muted>
              Organizacija · {members.length} {members.length === 1 ? "član" : "članova"}
            </AppText>
          </View>
        </AppCard>

        {/* Invite actions (OWNER/ADMIN) */}
        {canManageMembers && (
          <TeamInviteActions
            onOpenInviteModal={() => setInviteModalOpen(true)}
            onCreateLink={() =>
              createInviteLinkMutation.mutate({ organizationId, expiresInDays: 7 })
            }
            isCreatingLink={createInviteLinkMutation.isPending}
          />
        )}

        {/* Members list */}
        <TeamMembersList
          members={members}
          currentUserId={currentUserId}
          isLoading={membersQuery.isLoading}
          getMemberActions={getMemberActions}
          onMemberPress={(member) => {
            setActiveMember(member);
            setMemberSheetOpen(true);
          }}
        />

        {/* Pending invites (OWNER/ADMIN) */}
        {canManageMembers && (
          <TeamPendingInvites
            invites={invites}
            onInvitePress={(invite) => {
              setActiveInvite(invite);
              setInviteSheetOpen(true);
            }}
          />
        )}
      </ScrollView>

      {/* Invite member modal */}
      <TeamInviteMemberModal
        visible={inviteModalOpen}
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        canChangeRoles={canChangeRoles}
        isInviting={inviteMemberMutation.isPending}
        onEmailChange={setInviteEmail}
        onRoleChange={setInviteRole}
        onSubmit={() => {
          if (inviteEmail.trim()) {
            inviteMemberMutation.mutate({
              organizationId,
              emails: inviteEmail.trim().toLowerCase(),
              role: inviteRole,
            });
          }
        }}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteEmail("");
          setInviteRole("MEMBER");
        }}
      />

      {/* Member actions sheet */}
      <BottomSheet
        visible={memberSheetOpen}
        title={activeMember?.name ?? activeMember?.email}
        actions={activeMember ? getMemberActions(activeMember) : []}
        onClose={() => setMemberSheetOpen(false)}
      />

      {/* Role change sheet */}
      <BottomSheet
        visible={roleChangeSheetOpen}
        title="Promeni ulogu"
        actions={roleChangeActions}
        onClose={() => {
          setRoleChangeSheetOpen(false);
          setActiveMember(null);
        }}
      />

      {/* Invite actions sheet */}
      <BottomSheet
        visible={inviteSheetOpen}
        title={activeInvite?.email ?? "Link za pozivnicu"}
        actions={activeInvite ? getInviteActions(activeInvite) : []}
        onClose={() => setInviteSheetOpen(false)}
      />

      {/* Confirm remove member */}
      <ConfirmDialog
        visible={confirmRemoveMember}
        title="Ukloni člana"
        message="Da li ste sigurni da želite da uklonite ovog člana iz organizacije?"
        confirmLabel="Ukloni"
        destructive
        loading={removeMemberMutation.isPending}
        onConfirm={() => {
          if (activeMember) {
            removeMemberMutation.mutate({ organizationId, memberId: activeMember.id });
          }
        }}
        onCancel={() => {
          setConfirmRemoveMember(false);
          setActiveMember(null);
        }}
      />

      {/* Confirm delete invite */}
      <ConfirmDialog
        visible={confirmDeleteInvite}
        title="Obriši pozivnicu"
        message="Da li ste sigurni da želite da obrišete ovu pozivnicu?"
        confirmLabel="Obriši"
        destructive
        loading={deleteInviteMutation.isPending}
        onConfirm={() => {
          if (activeInvite) {
            deleteInviteMutation.mutate({ organizationId, inviteUrl: activeInvite.inviteUrl });
          }
        }}
        onCancel={() => {
          setConfirmDeleteInvite(false);
          setActiveInvite(null);
        }}
      />

      {/* Confirm leave organization */}
      <ConfirmDialog
        visible={confirmLeave}
        title="Napusti organizaciju"
        message="Da li ste sigurni da želite da napustite ovu organizaciju?"
        confirmLabel="Napusti"
        destructive
        loading={leaveMutation.isPending}
        onConfirm={() => leaveMutation.mutate({ organizationId })}
        onCancel={() => {
          setConfirmLeave(false);
          setActiveMember(null);
        }}
      />
    </>
  );
}
