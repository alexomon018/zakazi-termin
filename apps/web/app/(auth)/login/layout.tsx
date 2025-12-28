import { getAppUrl } from "@/lib/utils";
import type { Metadata } from "next";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Prijava",
  description:
    "Prijavite se na vas Salonko nalog i upravljajte terminima, klijentima i rasporedom.",
  openGraph: {
    title: "Prijava | Salonko",
    description: "Prijavite se na vas Salonko nalog i upravljajte terminima.",
    url: `${baseUrl}/login`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/login`,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
