import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  description: "Resetujte lozinku za vas Salonko nalog. Posaljite zahtev za novu lozinku.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://salonko.rs/forgot-password",
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
