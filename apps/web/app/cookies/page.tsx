import { LandingFooter, LandingHeader } from "@salonko/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika kolačića",
  description: "Saznajte kako Salonko koristi kolačiće za poboljšanje vašeg iskustva na platformi.",
};

export default function CookiesPolicyPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold text-foreground">Politika kolačića</h1>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Šta su kolačići?</h2>
            <p className="leading-relaxed text-muted-foreground">
              Kolačići su mali tekstualni fajlovi koji se čuvaju na vašem uređaju kada posetite našu
              web stranicu. Oni nam pomažu da zapamtimo vaše postavke, poboljšamo vaše iskustvo
              korišćenja sajta i razumemo kako korisnici koriste našu platformu.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Vrste kolačića koje koristimo
            </h2>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-foreground">Neophodni kolačići</h3>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Ovi kolačići su neophodni za funkcionisanje sajta i ne mogu se isključiti. Obično se
                postavljaju samo kao odgovor na vaše akcije, kao što su podešavanje privatnosti,
                prijavljivanje ili popunjavanje formulara.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm rounded-lg border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-medium text-left text-foreground">Naziv</th>
                      <th className="p-3 font-medium text-left text-foreground">Svrha</th>
                      <th className="p-3 font-medium text-left text-foreground">Trajanje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3 text-muted-foreground">next-auth.session-token</td>
                      <td className="p-3 text-muted-foreground">
                        Čuva informacije o vašoj sesiji za autentifikaciju
                      </td>
                      <td className="p-3 text-muted-foreground">Sesija</td>
                    </tr>
                    <tr>
                      <td className="p-3 text-muted-foreground">cookie-consent</td>
                      <td className="p-3 text-muted-foreground">
                        Pamti vaše postavke o kolačićima
                      </td>
                      <td className="p-3 text-muted-foreground">1 godina</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-foreground">Analitički kolačići</h3>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Ovi kolačići nam pomažu da razumemo kako posetioci koriste naš sajt. Koristimo ove
                informacije da poboljšamo našu platformu i pružimo bolje iskustvo korisnicima. Ovi
                kolačići se postavljaju samo uz vašu saglasnost.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm rounded-lg border border-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-medium text-left text-foreground">Provajder</th>
                      <th className="p-3 font-medium text-left text-foreground">Svrha</th>
                      <th className="p-3 font-medium text-left text-foreground">
                        Više informacija
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3 text-muted-foreground">Google Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Prikuplja anonimne statistike o posećivanju sajta
                      </td>
                      <td className="p-3">
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Politika privatnosti
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-muted-foreground">Vercel Analytics</td>
                      <td className="p-3 text-muted-foreground">
                        Prati performanse sajta i korišćenje
                      </td>
                      <td className="p-3">
                        <a
                          href="https://vercel.com/legal/privacy-policy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Politika privatnosti
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Kako upravljati kolačićima
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Kada prvi put posetite naš sajt, prikažaće vam se baner sa opcijama za upravljanje
              kolačićima. Možete izabrati da prihvatite sve kolačiće ili samo neophodne.
            </p>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Takođe možete upravljati kolačićima putem podešavanja vašeg pregledača. Većina
              pregledača vam omogućava da:
            </p>
            <ul className="mb-4 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Vidite koje kolačiće imate i obrišete ih pojedinačno</li>
              <li>Blokirate kolačiće trećih strana</li>
              <li>Blokirate kolačiće sa određenih sajtova</li>
              <li>Blokirate sve kolačiće</li>
              <li>Obrišete sve kolačiće kada zatvorite pregledač</li>
            </ul>
            <p className="leading-relaxed text-muted-foreground">
              Imajte na umu da blokiranje svih kolačića može uticati na funkcionalnost sajta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Kontakt</h2>
            <p className="leading-relaxed text-muted-foreground">
              Ako imate pitanja u vezi sa našom politikom kolačića, možete nas kontaktirati putem
              emaila na{" "}
              <a href="mailto:salonko.rs@gmail.com" className="text-primary hover:underline">
                salonko.rs@gmail.com
              </a>
              .
            </p>
          </section>

          <p className="pt-8 mt-12 text-sm border-t text-muted-foreground border-border">
            Poslednja izmena: {new Date().toLocaleDateString("sr-RS")}
          </p>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
