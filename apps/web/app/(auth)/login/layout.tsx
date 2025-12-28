import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prijava",
  description:
    "Prijavite se na vas Salonko nalog i upravljajte terminima, klijentima i rasporedom.",
  openGraph: {
    title: "Prijava | Salonko",
    description: "Prijavite se na vas Salonko nalog i upravljajte terminima.",
    url: "https://salonko.rs/login",
    type: "website",
  },
  alternates: {
    canonical: "https://salonko.rs/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
