import { Button, Link, Section, Text } from "@react-email/components";
import { getAppUrl } from "../utils";
import { BaseEmail, button, infoBox, infoRow, label, text } from "./base-email";

export interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  username?: string | null;
}

export function WelcomeEmail({ userName, userEmail, username }: WelcomeEmailProps) {
  const appUrl = getAppUrl();
  const dashboardUrl = `${appUrl}/dashboard`;
  const eventTypesUrl = `${appUrl}/dashboard/event-types`;
  const availabilityUrl = `${appUrl}/dashboard/availability`;
  const publicProfileUrl = username ? `${appUrl}/${username}` : null;

  return (
    <BaseEmail
      preview="Dobrodošli na Salonko - Vaš nalog je kreiran!"
      heading="Dobrodošli na Salonko!"
    >
      <Text style={text}>Poštovani/a {userName},</Text>
      <Text style={text}>
        Hvala Vam što ste se registrovali na Salonko! Vaš nalog je uspešno kreiran i spremni ste da
        počnete sa zakazivanjem termina.
      </Text>

      <Section style={infoBox}>
        <Text style={infoRow}>
          <span style={label}>Email:</span> {userEmail}
        </Text>
        {username && (
          <Text style={infoRow}>
            <span style={label}>Korisničko ime:</span> {username}
          </Text>
        )}
        {publicProfileUrl && (
          <Text style={infoRow}>
            <span style={label}>Vaš profil:</span>{" "}
            <Link href={publicProfileUrl} style={{ color: "#3b82f6" }}>
              {publicProfileUrl}
            </Link>
          </Text>
        )}
      </Section>

      <Text style={{ ...text, marginBottom: "0" }}>
        <strong>Sledeći koraci:</strong>
      </Text>

      <Section style={stepsBox}>
        <Text style={stepItem}>
          <span style={stepNumber}>1</span>
          <span style={stepText}>Kreirajte tipove termina - definišite usluge koje nudite</span>
        </Text>
        <Text style={stepItem}>
          <span style={stepNumber}>2</span>
          <span style={stepText}>Podesite dostupnost - odredite kada ste slobodni</span>
        </Text>
        <Text style={stepItem}>
          <span style={stepNumber}>3</span>
          <span style={stepText}>Podelite link - omogućite klijentima da zakažu termine</span>
        </Text>
      </Section>

      <Section style={{ padding: "0", marginTop: "24px", textAlign: "center" as const }}>
        <Link href={dashboardUrl} style={button}>
          Idite na kontrolnu tablu
        </Link>
      </Section>

      <Text style={{ ...text, marginTop: "24px" }}>
        Ako imate bilo kakvih pitanja ili Vam je potrebna pomoć, slobodno nas kontaktirajte.
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

// Additional styles for welcome email
const stepsBox = {
  backgroundColor: "#eff6ff",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "8px 0 16px",
  borderLeft: "4px solid #3b82f6",
};

const stepItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
  display: "flex" as const,
  alignItems: "flex-start" as const,
};

const stepNumber = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  borderRadius: "50%",
  width: "24px",
  height: "24px",
  display: "inline-block",
  textAlign: "center" as const,
  lineHeight: "24px",
  fontSize: "12px",
  fontWeight: "600",
  marginRight: "12px",
  flexShrink: 0,
};

const stepText = {
  flex: 1,
};

// Preview props for React Email dev server
WelcomeEmail.PreviewProps = {
  userName: "Marko Marković",
  userEmail: "marko@example.com",
  username: "marko",
} as WelcomeEmailProps;

export default WelcomeEmail;
