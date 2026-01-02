import { Link, Section, Text } from "@react-email/components";
import type { PaymentFailedEmailData } from "../types";
import { BaseEmail, button, buttonDanger, infoBox, text } from "./base-email";

/**
 * Email template that notifies a user their subscription payment failed and prompts updating the payment method.
 *
 * @param userName - Recipient's display name used in the greeting
 * @param billingPortalUrl - URL to the billing portal where the recipient can update their payment method
 * @returns The React element for the payment-failed email
 */
export function PaymentFailedEmail({ userName, billingPortalUrl }: PaymentFailedEmailData) {
  return (
    <BaseEmail
      preview="Vaše plaćanje nije uspelo - ažurirajte način plaćanja"
      heading="Plaćanje nije uspelo"
    >
      <Text style={text}>Poštovani {userName},</Text>
      <Text style={text}>
        Nažalost, vaše poslednje plaćanje za Salonko pretplatu nije uspelo. Da biste nastavili da
        koristite sve funkcije, molimo vas da ažurirate svoj način plaćanja.
      </Text>

      <Section style={infoBox}>
        <Text style={{ ...text, margin: 0, fontWeight: "600", color: "#dc2626" }}>
          Šta se dešava ako ne ažuriram plaćanje?
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Ako ne ažurirate način plaćanja u roku od 7 dana, vaš pristup kontrolnoj tabli će biti
          ograničen. Vaša stranica za online zakazivanje će i dalje raditi za vaše klijente.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={billingPortalUrl} style={buttonDanger}>
          Ažuriraj način plaćanja
        </Link>
      </Section>

      <Text style={text}>
        Ako imate bilo kakvih pitanja ili poteškoća, slobodno nas kontaktirajte.
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

PaymentFailedEmail.PreviewProps = {
  userEmail: "korisnik@example.com",
  userName: "Marko",
  salonName: "Studio Lepote Marija",
  billingPortalUrl: "https://salonko.rs/dashboard/settings/billing",
} as PaymentFailedEmailData;

export default PaymentFailedEmail;