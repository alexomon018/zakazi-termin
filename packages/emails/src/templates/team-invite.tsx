import { Button, Section, Text } from "@react-email/components";
import { BaseEmail, button, infoBox, infoRow, label, text } from "./base-email";

type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface TeamInviteEmailProps {
  inviterName: string;
  organizationName: string;
  role: Role;
  inviteUrl: string;
}

const roleLabels: Record<Role, string> = {
  OWNER: "Vlasnik",
  ADMIN: "Administrator",
  MEMBER: "Član tima",
};

export function TeamInviteEmail({
  inviterName,
  organizationName,
  role,
  inviteUrl,
}: TeamInviteEmailProps) {
  const roleLabel = roleLabels[role] || "Član tima";

  return (
    <BaseEmail
      preview={`${inviterName} vas poziva da se pridružite salonu ${organizationName}`}
      heading="Poziv u tim"
    >
      <Text style={text}>Zdravo!</Text>
      <Text style={text}>
        <strong>{inviterName}</strong> vas poziva da se pridružite salonu{" "}
        <strong>{organizationName}</strong> na platformi Salonko.
      </Text>

      <Section style={infoBox}>
        <Text style={infoRow}>
          <span style={label}>Salon: </span>
          {organizationName}
        </Text>
        <Text style={infoRow}>
          <span style={label}>Vaša uloga: </span>
          {roleLabel}
        </Text>
      </Section>

      <Text style={text}>
        Kao član tima moći ćete da upravljate svojim terminima, pregledate rezervacije i
        organizujete svoj raspored.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Button href={inviteUrl} style={button}>
          Prihvati poziv
        </Button>
      </Section>

      <Text style={{ ...text, color: "#6b7280", fontSize: "12px" }}>
        Ovaj poziv važi 7 dana. Ako niste očekivali ovaj email, možete ga ignorisati.
      </Text>
    </BaseEmail>
  );
}
