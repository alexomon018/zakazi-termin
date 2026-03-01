import { Shield, ShieldCheck, Users } from "lucide-react-native";

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Vlasnik",
  ADMIN: "Administrator",
  MEMBER: "Član",
};

export const ROLE_ICONS = {
  OWNER: ShieldCheck,
  ADMIN: Shield,
  MEMBER: Users,
} as const;
