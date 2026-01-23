import type { LucideIcon } from "lucide-react";
import { Shield, ShieldCheck, Users } from "lucide-react";

export const roleLabels: Record<string, string> = {
  OWNER: "Vlasnik",
  ADMIN: "Administrator",
  MEMBER: "Član",
};

export const roleIcons: Record<string, LucideIcon> = {
  OWNER: ShieldCheck,
  ADMIN: Shield,
  MEMBER: Users,
};
