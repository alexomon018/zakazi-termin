import { Link, Section, Text } from "@react-email/components";
import type { SubscriptionSuccessEmailData } from "../types";
import { BaseEmail, buttonSuccess, infoBox, text } from "./base-email";

export function SubscriptionSuccessEmail({
  userName,
  planName,
  dashboardUrl,
}: SubscriptionSuccessEmailData) {
  return (
    <BaseEmail
      preview="Vaša pretplata je aktivirana - dobrodošli u Salonko!"
      heading="Pretplata uspešno aktivirana"
    >
      <Text style={text}>Poštovani {userName},</Text>
      <Text style={text}>
        Čestitamo! Vaša <strong>{planName}</strong> pretplata je uspešno aktivirana.
      </Text>

      <Section style={infoBox}>
        <Text style={{ ...text, margin: 0, fontWeight: "600", color: "#059669" }}>
          Sada imate pristup svim funkcijama!
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Možete upravljati terminima, klijentima i svim podešavanjima vašeg salona bez ograničenja.
        </Text>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={dashboardUrl} style={buttonSuccess}>
          Idi na kontrolnu tablu
        </Link>
      </Section>

      <Text style={text}>
        Hvala vam što ste odabrali Salonko. Ako imate bilo kakva pitanja, slobodno nas
        kontaktirajte.
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

SubscriptionSuccessEmail.PreviewProps = {
  userEmail: "korisnik@example.com",
  userName: "Marko",
  salonName: "Studio Lepote Marija",
  planName: "Pro",
  dashboardUrl: "https://salonko.rs/dashboard",
} as SubscriptionSuccessEmailData;

export default SubscriptionSuccessEmail;
