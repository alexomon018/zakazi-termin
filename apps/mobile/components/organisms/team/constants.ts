import type { LucideIcon } from "lucide-react-native";
import { Shield, ShieldCheck, Users } from "lucide-react-native";

export const ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Vlasnik",
  ADMIN: "Administrator",
  MEMBER: "Član",
};

export const ROLE_ICONS: Record<Role, LucideIcon> = {
  OWNER: ShieldCheck,
  ADMIN: Shield,
  MEMBER: Users,
};
