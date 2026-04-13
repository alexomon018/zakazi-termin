import { Link, Section, Text } from "@react-email/components";
import { getAppUrl } from "@salonko/config";
import type { InactivityEmailData } from "../types";
import { BaseEmail, button, infoBox, text } from "./base-email";

export function InactivityReengagementEmail({ userName, dashboardUrl }: InactivityEmailData) {
  return (
    <BaseEmail preview="Nedostajete nam na Salonko!" heading="Vratite se na Salonko!">
      <Text style={text}>Poštovani/a {userName},</Text>
      <Text style={text}>
        Primetili smo da se niste prijavili na Salonko već neko vreme. Vaš salon i dalje čeka na Vas
        — možda imate nove rezervacije ili poruke od klijenata!
      </Text>

      <Section style={infoBox}>
        <Text style={highlightText}>Dok ste bili odsutni:</Text>
        <Text style={bulletItem}>• Klijenti su možda pokušali da zakažu termine</Text>
        <Text style={bulletItem}>• Vaš raspored čeka ažuriranje</Text>
        <Text style={bulletItem}>• Nove funkcije su dostupne za Vaš salon</Text>
      </Section>

      <Section style={{ padding: "0", marginTop: "24px", textAlign: "center" as const }}>
        <Link href={dashboardUrl} style={button}>
          Vratite se na kontrolnu tablu
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

const highlightText = {
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: "600" as const,
  lineHeight: "24px",
  margin: "0 0 8px",
};

const bulletItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "4px 0",
};

InactivityReengagementEmail.PreviewProps = {
  userName: "Marko Marković",
  userEmail: "marko@example.com",
  salonName: "Berbernica Langobard",
  dashboardUrl: `${getAppUrl()}/dashboard`,
} satisfies InactivityEmailData;

export default InactivityReengagementEmail;
