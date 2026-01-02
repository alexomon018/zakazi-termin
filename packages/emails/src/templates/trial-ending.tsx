import { Link, Section, Text } from "@react-email/components";
import type { TrialEndingEmailData } from "../types";
import { BaseEmail, button, buttonSuccess, infoBox, text } from "./base-email";

/**
 * Render an email template that notifies a user their free trial will expire soon and includes a renewal CTA.
 *
 * @param userName - Recipient's display name used in the greeting
 * @param daysRemaining - Number of days left in the trial
 * @param billingUrl - URL to the billing/subscription page used for the call-to-action link
 * @returns The JSX element for the trial-ending email
 */
export function TrialEndingEmail({ userName, daysRemaining, billingUrl }: TrialEndingEmailData) {
  const daysText = daysRemaining === 1 ? "dan" : daysRemaining < 5 ? "dana" : "dana";

  return (
    <BaseEmail
      preview={`Vaš probni period ističe za ${daysRemaining} ${daysText}`}
      heading="Probni period uskoro ističe"
    >
      <Text style={text}>Poštovani {userName},</Text>
      <Text style={text}>
        Želimo da vas podsetimo da vaš besplatni probni period na Salonko ističe za{" "}
        <strong>
          {daysRemaining} {daysText}
        </strong>
        .
      </Text>

      <Section style={infoBox}>
        <Text style={{ ...text, margin: 0, fontWeight: "600", color: "#059669" }}>
          Nastavite da koristite Salonko bez prekida
        </Text>
        <Text style={{ ...text, margin: "8px 0 0" }}>
          Pretplatite se sada i nastavite da koristite sve funkcije:
        </Text>
        <ul style={{ ...text, margin: "8px 0 0", paddingLeft: "20px" }}>
          <li>Online zakazivanje termina</li>
          <li>Upravljanje rasporedom</li>
          <li>Automatski podsetnici</li>
          <li>Pregled statistike</li>
        </ul>
      </Section>

      <Section style={{ textAlign: "center", margin: "24px 0" }}>
        <Link href={billingUrl} style={buttonSuccess}>
          Pretplati se sada
        </Link>
      </Section>

      <Text style={text}>
        Ako se pretplatite pre isteka probnog perioda, vaši preostali dani se prenose.
      </Text>

      <Text style={text}>Imate pitanja? Slobodno nam se javite, tu smo da pomognemo!</Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>
    </BaseEmail>
  );
}

TrialEndingEmail.PreviewProps = {
  userEmail: "korisnik@example.com",
  userName: "Marko",
  salonName: "Studio Lepote Marija",
  daysRemaining: 3,
  billingUrl: "https://salonko.rs/dashboard/settings/billing",
} as TrialEndingEmailData;

export default TrialEndingEmail;