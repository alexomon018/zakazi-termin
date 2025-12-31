import { Button } from "@salonko/ui";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stranica nije pronađena",
  description:
    "Stranica koju tražite ne postoji ili je premeštena. Vratite se na početnu stranicu Salonko platforme za zakazivanje termina.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">404</h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Stranica nije pronađena
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Stranica koju tražite ne postoji, premeštena je ili je privremeno nedostupna. Proverite
          URL adresu ili se vratite na početnu stranicu.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg">Nazad na početnu</Button>
          </Link>
          <Link href="/faq">
            <Button variant="outline" size="lg">
              Pomoć i podrška
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Ako mislite da je ovo greška, kontaktirajte nas na{" "}
          <a href="mailto:podrska@salonko.rs" className="text-blue-600 hover:underline">
            podrska@salonko.rs
          </a>
        </p>
      </div>
    </div>
  );
}
