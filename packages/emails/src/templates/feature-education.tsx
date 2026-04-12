import { Link, Section, Text } from "@react-email/components";
import { getAppUrl } from "@salonko/config";
import type { FeatureEducationEmailData } from "../types";
import { BaseEmail, button, infoBox, text } from "./base-email";

export function FeatureEducationEmail({
  userName,
  featureTitle,
  featureDescription,
  helpArticleUrl,
  ctaText,
  ctaUrl,
  stepNumber,
  totalSteps,
  unsubscribeUrl,
}: FeatureEducationEmailData) {
  return (
    <BaseEmail preview={featureTitle} heading={featureTitle}>
      <Text style={text}>Poštovani/a {userName},</Text>
      <Text style={text}>{featureDescription}</Text>

      <Section style={{ padding: "0", marginTop: "24px", textAlign: "center" as const }}>
        <Link href={ctaUrl} style={button}>
          {ctaText}
        </Link>
      </Section>

      <Section style={infoBox}>
        <Text style={helpLinkText}>
          Želite da saznate više? Pročitajte{" "}
          <Link href={helpArticleUrl} style={helpLink}>
            detaljan vodič
          </Link>{" "}
          u našem centru za pomoć.
        </Text>
      </Section>

      <Text style={progressText}>
        Korak {stepNumber} od {totalSteps} — Upoznajte sve mogućnosti Salonko platforme
      </Text>

      <Text style={text}>
        Srdačan pozdrav,
        <br />
        Tim Salonko
      </Text>

      <Text style={unsubscribeText}>
        Ne želite više ove emailove?{" "}
        <Link href={unsubscribeUrl} style={unsubscribeLink}>
          Odjavite se
        </Link>
      </Text>
    </BaseEmail>
  );
}

const helpLinkText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
};

const helpLink = {
  color: "#3b82f6",
  textDecoration: "underline",
};

const progressText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "20px",
  textAlign: "center" as const,
  margin: "24px 0 16px",
};

const unsubscribeText = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "16px",
  textAlign: "center" as const,
  margin: "16px 0 0",
};

const unsubscribeLink = {
  color: "#9ca3af",
  textDecoration: "underline",
};

FeatureEducationEmail.PreviewProps = {
  userName: "Marko Marković",
  userEmail: "marko@example.com",
  salonName: "Berbernica Langobard",
  featureTitle: "Kreirajte svoju prvu uslugu",
  featureDescription:
    "Definišite usluge koje nudite u svom salonu — od šišanja do farbanja. Svaka usluga ima svoj naziv, trajanje i opis koji klijenti vide pri zakazivanju.",
  helpArticleUrl: `${getAppUrl()}/help/pocetak/prvi-tip-dogadjaja`,
  ctaText: "Kreirajte uslugu",
  ctaUrl: `${getAppUrl()}/dashboard/event-types`,
  stepNumber: 1,
  totalSteps: 6,
  unsubscribeUrl: `${getAppUrl()}/api/email/unsubscribe?token=example&type=education`,
} satisfies FeatureEducationEmailData;

export default FeatureEducationEmail;
