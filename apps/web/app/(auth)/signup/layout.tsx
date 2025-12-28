import { getAppUrl } from "@/lib/utils";
import type { Metadata } from "next";

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: "Registracija",
  description:
    "Kreirajte besplatan Salonko nalog i pocnite da primate online rezervacije za vas salon.",
  openGraph: {
    title: "Registracija | Salonko",
    description: "Kreirajte besplatan Salonko nalog i pocnite da primate online rezervacije.",
    url: `${baseUrl}/signup`,
    type: "website",
  },
  alternates: {
    canonical: `${baseUrl}/signup`,
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
