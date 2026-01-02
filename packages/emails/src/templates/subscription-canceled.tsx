import { Link, Section, Text } from "@react-email/components";
import type { SubscriptionCanceledEmailData } from "../types";
import { BaseEmail, button, infoBox, text } from "./base-email";

/**
 * Render an email that notifies a user their subscription has been canceled and provides reactivation details.
 *
 * @param userName - The recipient's display name used in the greeting.
 * @param currentPeriodEnd - The end of the current billing period (Date or ISO string); shown in the email as a localized long date.
 * @param resumeUrl - A URL the user can follow to reactivate or resume their subscription.
 * @returns The JSX email template for the subscription-canceled notification.
 */
export function SubscriptionCanceledEmail({
  userName,
  currentPeriodEnd,
  resumeUrl,
}: SubscriptionCanceledEmailData) {
  const formattedDate = new Date(currentPeriodEnd).toLocaleDateString("sr-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <BaseEmail preview="Vaša pretplata je otkazana" heading="Pretplata otkazana">
      <Text style={text}>Poštovani {userName},</Text>
      <Text style={text}>Uspešno smo primili vaš zahtev za otkazivanje pretplate na Salonko.</Text>

      <Section style={infoBox}>
        <Text style={{ ...text, margin: 0, fontWeight: "600" }}>Šta dalje?</Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Vaša pretplata ostaje aktivna do kraja tekućeg obračunskog perioda:{" "}
          <strong>{formattedDate}</strong>
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Do tog datuma imate pun pristup svim funkcijama Salonko.
        </Text>
      </Section>

      <Text style={text}>
        Predomislili ste se? Možete ponovo aktivirati pretplatu u bilo kom trenutku pre isteka.
      </Text>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={resumeUrl} style={button}>
          Nastavi pretplatu
        </Link>
      </Section>

      <Text style={text}>
        Žao nam je što odlazite. Ako imate bilo kakve povratne informacije o tome kako možemo da
        poboljšamo Salonko, slobodno nam se javite.
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

SubscriptionCanceledEmail.PreviewProps = {
  userEmail: "korisnik@example.com",
  userName: "Marko",
  salonName: "Studio Lepote Marija",
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  resumeUrl: "https://salonko.rs/dashboard/settings/billing",
} as SubscriptionCanceledEmailData;

export default SubscriptionCanceledEmail;