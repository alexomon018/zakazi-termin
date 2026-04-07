import { Section, Text } from "@react-email/components";
import { BaseEmail, infoBox, infoRow, label, text } from "./base-email";

export interface SupportRequestEmailProps {
  email: string;
  subject: string;
  salonName?: string;
  category: string;
  categoryLabel: string;
  description: string;
}

export function SupportRequestEmail({
  email,
  subject,
  salonName,
  category,
  categoryLabel,
  description,
}: SupportRequestEmailProps) {
  return (
    <BaseEmail preview={`Novi zahtev za podršku: ${subject}`} heading="Novi zahtev za podršku">
      <Text style={text}>Primljen je novi zahtev za podršku sa centra za pomoć.</Text>

      <Section style={infoBox}>
        <Text style={infoRow}>
          <span style={label}>Email: </span>
          {email}
        </Text>
        <Text style={infoRow}>
          <span style={label}>Naslov: </span>
          {subject}
        </Text>
        {salonName && (
          <Text style={infoRow}>
            <span style={label}>Salon: </span>
            {salonName}
          </Text>
        )}
        <Text style={infoRow}>
          <span style={label}>Kategorija: </span>
          {categoryLabel} ({category})
        </Text>
      </Section>

      <Text style={{ ...text, fontWeight: "600", marginBottom: "4px" }}>Opis problema:</Text>
      <Section style={descriptionBox}>
        <Text style={descriptionText}>{description}</Text>
      </Section>

      <Text style={{ ...text, color: "#6b7280", fontSize: "12px", marginTop: "24px" }}>
        Odgovori korisniku na: {email}
      </Text>
    </BaseEmail>
  );
}

const descriptionBox = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "16px 20px",
  margin: "8px 0",
};

const descriptionText = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

SupportRequestEmail.PreviewProps = {
  email: "marko@primer.com",
  subject: "Problem sa zakazivanjem termina",
  salonName: "Studio Lepote Marija",
  category: "tehnicka-podrska",
  categoryLabel: "Tehnička podrška",
  description:
    "Kada klijent pokuša da zakaže termin u utorak, pojavljuje se greška 'Nema slobodnih termina' iako imam slobodne slotove tog dana. Problem se javlja od prošle nedelje.",
} satisfies SupportRequestEmailProps;
