import { getAppUrl } from "@/lib/utils";
import type { Metadata } from "next";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  description: "Resetujte lozinku za vas Salonko nalog. Posaljite zahtev za novu lozinku.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: `${baseUrl}/forgot-password`,
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
