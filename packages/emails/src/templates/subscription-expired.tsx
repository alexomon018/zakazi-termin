import { Link, Section, Text } from "@react-email/components";
import type { SubscriptionExpiredEmailData } from "../types";
import { BaseEmail, buttonSuccess, infoBox, text } from "./base-email";

/**
 * Render an email template that notifies a user their subscription has expired and prompts them to renew.
 *
 * @param userName - Recipient display name used in the greeting
 * @param billingUrl - URL for the billing/renewal page used by the call-to-action button
 * @returns The JSX for the subscription-expired email template
 */
export function SubscriptionExpiredEmail({ userName, billingUrl }: SubscriptionExpiredEmailData) {
  return (
    <BaseEmail
      preview="Vaša pretplata je istekla - ponovo aktivirajte pristup"
      heading="Pretplata istekla"
    >
      <Text style={text}>Poštovani {userName},</Text>
      <Text style={text}>
        Vaša Salonko pretplata je istekla i pristup kontrolnoj tabli je sada ograničen.
      </Text>

      <Section style={infoBox}>
        <Text style={{ ...text, margin: 0, fontWeight: "600", color: "#059669" }}>
          Dobra vest - vaši podaci su sačuvani!
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Svi vaši termini, klijenti i podešavanja su bezbedno sačuvani. Možete ponovo pristupiti
          svemu čim obnovite pretplatu.
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          <strong>Napomena:</strong> Vaša stranica za online zakazivanje i dalje radi, tako da
          klijenti mogu zakazivati termine.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={billingUrl} style={buttonSuccess}>
          Obnovi pretplatu
        </Link>
      </Section>

      <Text style={text}>Imate pitanja? Tu smo da pomognemo!</Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

SubscriptionExpiredEmail.PreviewProps = {
  userEmail: "korisnik@example.com",
  userName: "Marko",
  salonName: "Studio Lepote Marija",
  billingUrl: "https://salonko.rs/dashboard/settings/billing",
} as SubscriptionExpiredEmailData;

export default SubscriptionExpiredEmail;