import { Link, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseEmail, button, infoBox, infoRow, label, text } from "./base-email";

export interface PasswordResetEmailProps {
  userName: string;
  userEmail: string;
  resetUrl: string;
}

export function PasswordResetEmail({ userName, userEmail, resetUrl }: PasswordResetEmailProps) {
  return (
    <BaseEmail preview="Resetujte vašu lozinku na Salonko" heading="Zahtev za resetovanje lozinke">
      <Text style={text}>Poštovani/a {userName},</Text>
      <Text style={text}>
        Primili smo zahtev za resetovanje lozinke za vaš nalog na Salonko. Ako niste vi zatražili
        ovu promenu, slobodno ignorišite ovaj email.
      </Text>

      <Section style={infoBox}>
        <Text style={infoRow}>
          <span style={label}>Email:</span> {userEmail}
        </Text>
      </Section>

      <Text style={text}>
        Kliknite na dugme ispod da biste resetovali vašu lozinku. Link važi <strong>1 sat</strong>.
      </Text>

      <Section style={{ padding: "0", marginTop: "24px", textAlign: "center" as const }}>
        <Link href={resetUrl} style={button}>
          Resetuj lozinku
        </Link>
      </Section>

      <Text style={warningText}>
        Ako niste zatražili resetovanje lozinke, ignorišite ovaj email. Vaša lozinka neće biti
        promenjena.
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

const warningText = {
  ...text,
  marginTop: "24px",
  padding: "12px 16px",
  backgroundColor: "#fef3c7",
  borderRadius: "6px",
  borderLeft: "4px solid #f59e0b",
  color: "#92400e",
};

// Preview props for React Email dev server
PasswordResetEmail.PreviewProps = {
  userName: "Marko Marković",
  userEmail: "marko@example.com",
  resetUrl: "http://localhost:3000/reset-password?token=abc123",
} as PasswordResetEmailProps;

export default PasswordResetEmail;
