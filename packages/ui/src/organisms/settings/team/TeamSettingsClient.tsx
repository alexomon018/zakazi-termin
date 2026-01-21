/* eslint-disable react/jsx-no-useless-fragment */
"use client";

import { trpc } from "@/lib/trpc/client";
import { ConfirmDialog } from "@salonko/ui";
import { AlertCircle, Check } from "lucide-react";
import { useState } from "react";

import { TeamCreateOrganization } from "./TeamCreateOrganization";
import { TeamInviteActions } from "./TeamInviteActions";
import { TeamInviteMemberDialog } from "./TeamInviteMemberDialog";
import { TeamMembersList } from "./TeamMembersList";
import { TeamPendingInvites } from "./TeamPendingInvites";
import { roleLabels } from "./constants";
import type { Invite, Member, Organization, User } from "./types";

type TeamSettingsClientProps = {
  initialOrganization: Organization;
  initialMembers: Member[];
  initialInvites: Invite[];
  currentUser: User;
};

export function TeamSettingsClient({
  initialOrganization,
  initialMembers,
  initialInvites,
  currentUser,
}: TeamSettingsClientProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [inviteToDelete, setInviteToDelete] = useState<Invite | null>(null);
  const [deleteInviteDialogOpen, setDeleteInviteDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState(currentUser?.salonName || "");

  const utils = trpc.useUtils();

  // Queries with initial data
  const { data: organization } = trpc.organization.get.useQuery(undefined, {
    initialData: initialOrganization ?? undefined,
  });

  const { data: members } = trpc.team.listMembers.useQuery(
    { organizationId: organization?.id || "" },
    {
      initialData: initialMembers,
      enabled: !!organization?.id,
    }
  );

  const { data: invites } = trpc.team.listInvites.useQuery(
    { organizationId: organization?.id || "" },
    {
      initialData: initialInvites,
      enabled: !!organization?.id,
    }
  );

  // Mutations
  const createOrganization = trpc.organization.create.useMutation({
    onSuccess: async () => {
      await utils.organization.get.invalidate();
      setCreateOrgDialogOpen(false);
      showSuccess("Organizacija je uspešno kreirana!");
    },
    onError: (error) => {
      showError(error.message || "Greška pri kreiranju organizacije. Pokušajte ponovo.");
    },
  });

  const inviteMember = trpc.team.inviteMember.useMutation({
    onSuccess: async (result) => {
      await utils.team.listInvites.invalidate();
      setInviteDialogOpen(false);
      setInviteEmail("");
      const invitedCount = result.results.filter((r) => r.status === "invited").length;
      if (invitedCount > 0) {
        showSuccess(`Pozivnica je poslata${invitedCount > 1 ? ` (${invitedCount})` : ""}!`);
      }
    },
  });

  const createInviteLink = trpc.team.createInviteLink.useMutation({
    onSuccess: async (result) => {
      await utils.team.listInvites.invalidate();
      try {
        await navigator.clipboard.writeText(result.inviteLink);
        setCopySuccess(true);
        showSuccess("Link za pozivnicu je kopiran!");
      } catch (error) {
        setCopySuccess(false);
        showError("Nije moguće automatski kopirati link. Pokušajte ponovo ili kopirajte ga ručno.");
      } finally {
        setTimeout(() => setCopySuccess(false), 3000);
      }
    },
    onError: (error) => {
      showError(error.message || "Greška pri kreiranju linka za pozivnicu. Pokušajte ponovo.");
    },
  });

  const removeMember = trpc.team.removeMember.useMutation({
    onSuccess: async () => {
      await utils.team.listMembers.invalidate();
      setDeleteDialogOpen(false);
      setMemberToRemove(null);
      showSuccess("Član je uklonjen iz tima.");
    },
  });

  const changeMemberRole = trpc.team.changeMemberRole.useMutation({
    onSuccess: async () => {
      await utils.team.listMembers.invalidate();
      showSuccess("Uloga člana je promenjena.");
    },
  });

  const deleteInvite = trpc.team.deleteInvite.useMutation({
    onSuccess: async () => {
      await utils.team.listInvites.invalidate();
      setDeleteInviteDialogOpen(false);
      setInviteToDelete(null);
      showSuccess("Pozivnica je obrisana.");
    },
    onError: (error) => {
      showError(error.message || "Greška pri brisanju pozivnice. Pokušajte ponovo.");
    },
  });

  const resendInvite = trpc.team.resendInvite.useMutation({
    onSuccess: () => {
      showSuccess("Pozivnica je ponovo poslata.");
    },
    onError: (error) => {
      showError(error.message || "Greška pri ponovnom slanju pozivnice. Pokušajte ponovo.");
    },
  });

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  const handleInviteMember = () => {
    if (!organization?.id || !inviteEmail.trim()) return;
    inviteMember.mutate({
      organizationId: organization.id,
      emails: inviteEmail.trim(),
      role: inviteRole,
    });
  };

  const handleCreateInviteLink = () => {
    if (!organization?.id) return;
    createInviteLink.mutate({
      organizationId: organization.id,
      expiresInDays: 7,
    });
  };

  const handleRemoveMember = () => {
    if (!organization?.id || !memberToRemove) return;
    removeMember.mutate({
      organizationId: organization.id,
      memberId: memberToRemove.id,
    });
  };

  const handleChangeRole = (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    if (!organization?.id) return;
    changeMemberRole.mutate({
      organizationId: organization.id,
      memberId,
      role: newRole,
    });
  };

  const handleDeleteInvite = () => {
    if (!organization?.id || !inviteToDelete) return;
    deleteInvite.mutate({
      organizationId: organization.id,
      token: inviteToDelete.token,
    });
  };

  const handleResendInvite = (email: string) => {
    if (!organization?.id) return;
    resendInvite.mutate({
      organizationId: organization.id,
      email,
    });
  };

  const currentUserRole = organization?.role;
  const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const canChangeRoles = currentUserRole === "OWNER";

  // If user doesn't have an organization, show create organization UI
  if (!organization) {
    return (
      <TeamCreateOrganization
        orgName={orgName}
        isDialogOpen={createOrgDialogOpen}
        isCreating={createOrganization.isPending}
        error={errorMessage || createOrganization.error?.message}
        onOrgNameChange={setOrgName}
        onDialogChange={setCreateOrgDialogOpen}
        onCreateOrganization={() => createOrganization.mutate({ name: orgName })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tim</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Upravljajte članovima tima za {organization.name}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300">{successMessage}</span>
        </div>
      )}

      {/* Error Messages */}
      {(errorMessage ||
        inviteMember.error ||
        removeMember.error ||
        changeMemberRole.error ||
        createInviteLink.error ||
        deleteInvite.error ||
        resendInvite.error) && (
        <div className="flex gap-3 items-center p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-300">
            {errorMessage ||
              inviteMember.error?.message ||
              removeMember.error?.message ||
              changeMemberRole.error?.message ||
              createInviteLink.error?.message ||
              deleteInvite.error?.message ||
              resendInvite.error?.message}
          </span>
        </div>
      )}

      {/* Invite Actions */}
      {canManageMembers && (
        <TeamInviteActions
          canManageMembers={canManageMembers}
          copySuccess={copySuccess}
          isCreatingInviteLink={createInviteLink.isPending}
          onOpenInviteDialog={() => setInviteDialogOpen(true)}
          onCreateInviteLink={handleCreateInviteLink}
        />
      )}

      {/* Team Members */}
      <TeamMembersList
        members={members}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        canManageMembers={canManageMembers}
        canChangeRoles={canChangeRoles}
        onChangeRole={handleChangeRole}
        onRemoveMember={(member) => {
          setMemberToRemove(member);
          setDeleteDialogOpen(true);
        }}
      />

      {/* Pending Invitations */}
      {canManageMembers && invites && invites.length > 0 && (
        <TeamPendingInvites
          invites={invites}
          isResendPending={resendInvite.isPending}
          onResendInvite={handleResendInvite}
          onCopyLink={async (invite) => {
            const baseUrl =
              typeof window !== "undefined"
                ? window.location.origin
                : process.env.NEXT_PUBLIC_APP_URL || "";
            const inviteUrl = `${baseUrl}/signup?token=${invite.token}`;
            try {
              await navigator.clipboard.writeText(inviteUrl);
              showSuccess("Link kopiran!");
            } catch (error) {
              showError(
                "Nije moguće automatski kopirati link. Pokušajte ponovo ili kopirajte ga ručno."
              );
            }
          }}
          onDeleteInvite={(invite) => {
            setInviteToDelete(invite);
            setDeleteInviteDialogOpen(true);
          }}
        />
      )}

      {/* Invite Member Dialog */}
      <TeamInviteMemberDialog
        open={inviteDialogOpen}
        currentUserRole={currentUserRole}
        inviteEmail={inviteEmail}
        inviteRole={inviteRole}
        isInviting={inviteMember.isPending}
        onOpenChange={setInviteDialogOpen}
        onEmailChange={setInviteEmail}
        onRoleChange={(role) => setInviteRole(role)}
        onInvite={handleInviteMember}
      />

      {/* Remove Member Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleRemoveMember}
        title="Ukloni člana"
        description={`Da li ste sigurni da želite da uklonite ${memberToRemove?.name || memberToRemove?.email} iz tima?`}
        confirmText="Ukloni"
        isLoading={removeMember.isPending}
        variant="destructive"
      />

      {/* Delete Invite Dialog */}
      <ConfirmDialog
        open={deleteInviteDialogOpen}
        onOpenChange={setDeleteInviteDialogOpen}
        onConfirm={handleDeleteInvite}
        title="Obriši pozivnicu"
        description={`Da li ste sigurni da želite da obrišete pozivnicu${inviteToDelete?.email ? ` za ${inviteToDelete.email}` : ""}?`}
        confirmText="Obriši"
        isLoading={deleteInvite.isPending}
        variant="destructive"
      />
    </div>
  );
}
