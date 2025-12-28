import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registracija",
  description:
    "Kreirajte besplatan Salonko nalog i pocnite da primate online rezervacije za vas salon.",
  openGraph: {
    title: "Registracija | Salonko",
    description: "Kreirajte besplatan Salonko nalog i pocnite da primate online rezervacije.",
    url: "https://salonko.rs/signup",
    type: "website",
  },
  alternates: {
    canonical: "https://salonko.rs/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
