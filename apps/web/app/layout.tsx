import { ConditionalAnalytics } from "@/components/ConditionalAnalytics";
import { getAppUrl } from "@/lib/utils";
import { CookieBanner } from "@salonko/ui";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const baseUrl = getAppUrl();

export const metadata: Metadata = {
  title: {
    default: "Salonko - Online zakazivanje termina za salone",
    template: "%s | Salonko",
  },
  description:
    "Salonko je moderna platforma za online zakazivanje termina u Srbiji. Omogućite klijentima da zakažu termine 24/7 - jednostavno, brzo i besplatno. Idealno za frizerske i kozmetičke salone.",
  keywords: [
    "zakazivanje termina",
    "frizerski salon",
    "kozmeticki salon",
    "online rezervacija",
    "salonko",
    "beauty salon srbija",
    "zakazivanje online",
    "salon lepote",
  ],
  authors: [{ name: "Salonko" }],
  creator: "Salonko",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: baseUrl,
    siteName: "Salonko",
    title: "Salonko - Online zakazivanje termina za salone",
    description:
      "Moderna platforma za online zakazivanje termina u Srbiji. Omogućite klijentima da zakažu termine 24/7 - besplatno za frizerske i kozmetičke salone.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Salonko - Platforma za zakazivanje termina",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salonko - Online zakazivanje termina za salone",
    description:
      "Moderna platforma za online zakazivanje termina u Srbiji. Omogućite klijentima da zakažu termine 24/7 - besplatno za frizerske i kozmetičke salone.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
          <ConditionalAnalytics />
        </Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
