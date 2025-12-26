import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type * as React from "react";

interface BaseEmailProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
}

export function BaseEmail({ preview, heading, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with logo */}
          <Section style={header}>
            <table cellPadding="0" cellSpacing="0" style={{ width: "100%" }}>
              <tr>
                <td style={{ textAlign: "center" }}>
                  <span style={calendarIcon}>📅</span>
                  <span style={logoText}>Salonko</span>
                </td>
              </tr>
            </table>
          </Section>
          <Hr style={headerHr} />
          <Heading style={h1}>{heading}</Heading>
          {children}
          <Hr style={hr} />
          <Text style={footer}>Salonko - Vaš partner za zakazivanje termina</Text>
          <Text style={footerLinks}>© {new Date().getFullYear()} Salonko. Sva prava zadržana.</Text>
        </Container>
      </Body>
    </Html>
  );
}

// Shared styles
const main = {
  backgroundColor: "#f0f4f8",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "0 24px 48px",
  marginBottom: "64px",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  maxWidth: "600px",
  width: "100%",
};

const header = {
  padding: "24px 24px 16px",
  textAlign: "center" as const,
};

const calendarIcon = {
  fontSize: "28px",
  verticalAlign: "middle",
};

const logoText = {
  color: "#1f2937",
  fontSize: "20px",
  fontWeight: "700",
  marginLeft: "8px",
  verticalAlign: "middle",
};

const headerHr = {
  borderColor: "#3b82f6",
  borderWidth: "2px",
  margin: "0 0 20px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "16px 0",
  padding: "0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0",
  margin: "0",
};

const footerLinks = {
  color: "#a0aec0",
  fontSize: "11px",
  lineHeight: "14px",
  textAlign: "center" as const,
  padding: "0",
  margin: "8px 0 0",
};

// Shared component styles
export const text = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  padding: "0",
};

export const infoBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "8px",
  padding: "16px 24px",
  margin: "16px 0",
};

export const infoRow = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "4px 0",
};

export const label = {
  color: "#6b7280",
  fontWeight: "500",
};

export const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
};

export const buttonDanger = {
  ...button,
  backgroundColor: "#ef4444",
};

export const buttonSuccess = {
  ...button,
  backgroundColor: "#22c55e",
};
