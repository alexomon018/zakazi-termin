import { Section, Text } from "@react-email/components";
import { BaseEmail, text } from "./base-email";

export interface EmailVerificationEmailProps {
  userName: string;
  userEmail: string;
  verificationCode: string;
}

export function EmailVerificationEmail({
  userName,
  userEmail,
  verificationCode,
}: EmailVerificationEmailProps) {
  return (
    <BaseEmail preview="Vaš verifikacioni kod za Salonko" heading="Verifikujte vašu email adresu">
      <Text style={text}>Poštovani/a {userName},</Text>
      <Text style={text}>
        Hvala vam što ste se registrovali na Salonko. Da biste dovršili registraciju, unesite
        sledeći verifikacioni kod:
      </Text>

      <Section style={codeBox}>
        <Text style={codeText}>{verificationCode}</Text>
      </Section>

      <Text style={text}>
        Ovaj kod važi <strong>15 minuta</strong>. Ako niste zatražili ovaj kod, slobodno ignorišite
        ovaj email.
      </Text>

      <Section style={emailInfo}>
        <Text style={emailInfoText}>
          Kod je poslat na: <strong>{userEmail}</strong>
        </Text>
      </Section>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

const codeBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeText = {
  fontSize: "32px",
  fontWeight: "700",
  letterSpacing: "8px",
  color: "#1f2937",
  margin: "0",
  fontFamily: "monospace",
};

const emailInfo = {
  backgroundColor: "#eff6ff",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "16px 0",
};

const emailInfoText = {
  ...text,
  margin: "0",
  color: "#1e40af",
  fontSize: "13px",
};

// Preview props for React Email dev server
EmailVerificationEmail.PreviewProps = {
  userName: "Marko Marković",
  userEmail: "marko@gmail.com",
  verificationCode: "123456",
} as EmailVerificationEmailProps;

export default EmailVerificationEmail;
