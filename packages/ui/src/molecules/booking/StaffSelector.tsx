"use client";

import { cn } from "@salonko/ui";
import { UserAvatar } from "@salonko/ui/molecules/user/UserAvatar";
import { Check } from "lucide-react";

export type StaffMember = {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
};

interface StaffSelectorProps {
  staff: StaffMember[];
  selectedStaffId: string | null;
  onSelectStaff: (staffUserId: string | null) => void;
  className?: string;
}

export function StaffSelector({
  staff,
  selectedStaffId,
  onSelectStaff,
  className,
}: StaffSelectorProps) {
  if (staff.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Izaberite zaposlenog</h3>
      <div className="flex flex-wrap gap-3">
        {staff.map((member) => {
          const isSelected = selectedStaffId === member.userId;
          return (
            <button
              key={member.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectStaff(isSelected ? null : member.userId)}
              className={cn(
                "flex gap-3 items-center px-4 py-3 rounded-lg border-2 transition-all",
                "hover:border-gray-300 dark:hover:border-gray-600",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                isSelected
                  ? "bg-gray-50 border-[var(--brand-color)] dark:border-[var(--brand-color-dark)] dark:bg-gray-800"
                  : "bg-white border-gray-200 dark:border-gray-700 dark:bg-gray-900"
              )}
            >
              <div className="relative">
                <UserAvatar
                  name={member.user.name || ""}
                  image={member.user.avatarUrl || undefined}
                  size="md"
                />
                {isSelected && (
                  <div className="absolute -right-1 -bottom-1 p-0.5 rounded-full bg-[var(--brand-color)] dark:bg-[var(--brand-color-dark)]">
                    <Check className="w-3 h-3 text-white dark:text-gray-900" />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "font-medium",
                  isSelected
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-700 dark:text-gray-300"
                )}
              >
                {member.user.name || "Bez imena"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
