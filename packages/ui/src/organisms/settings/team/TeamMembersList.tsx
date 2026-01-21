import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@salonko/ui";
import { UserMinus, Users } from "lucide-react";

import { roleIcons, roleLabels } from "./constants";
import type { Member, User } from "./types";

type TeamMembersListProps = {
  members: Member[] | undefined;
  currentUser: User;
  currentUserRole: string | undefined;
  canManageMembers: boolean;
  canChangeRoles: boolean;
  onChangeRole: (memberId: string, newRole: "ADMIN" | "MEMBER") => void;
  onRemoveMember: (member: Member) => void;
};

export function TeamMembersList({
  members,
  currentUser,
  currentUserRole,
  canManageMembers,
  canChangeRoles,
  onChangeRole,
  onRemoveMember,
}: TeamMembersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex gap-2 items-center text-lg">
          <Users className="w-5 h-5" />
          Članovi tima ({members?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {members?.map((member) => {
            const RoleIcon = roleIcons[member.role] || Users;
            const isCurrentUser = member.userId === currentUser?.id;
            const canEditThisMember = canChangeRoles && !isCurrentUser && member.role !== "OWNER";
            const canRemoveThisMember =
              canManageMembers &&
              !isCurrentUser &&
              member.role !== "OWNER" &&
              (currentUserRole === "OWNER" || member.role === "MEMBER");

            return (
              <div
                key={member.id}
                className="flex flex-col gap-3 justify-between p-4 sm:flex-row sm:items-center"
              >
                <div className="flex gap-3 items-center">
                  <div className="flex justify-center items-center w-10 h-10 bg-gray-100 rounded-full dark:bg-gray-800">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name || ""}
                        className="object-cover w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {(member.name || member.email)[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate dark:text-white">
                      {member.name || "Bez imena"}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Vi)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 items-center sm:gap-3">
                  {canEditThisMember ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) =>
                        onChangeRole(member.id, value as "ADMIN" | "MEMBER")
                      }
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Administrator</SelectItem>
                        <SelectItem value="MEMBER">Član</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm">
                      <RoleIcon className="w-4 h-4" />
                      <span>{roleLabels[member.role]}</span>
                    </div>
                  )}

                  {canRemoveThisMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => onRemoveMember(member)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
