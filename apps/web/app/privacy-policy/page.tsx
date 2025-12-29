import { LandingFooter, LandingHeader } from "@salonko/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Saznajte kako Salonko prikuplja, koristi i štiti vaše lične podatke.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-8 text-3xl font-bold text-foreground">Politika privatnosti</h1>

          <p className="mb-8 leading-relaxed text-muted-foreground">
            Salonko (u daljem tekstu: &quot;mi&quot;, &quot;nas&quot; ili &quot;platforma&quot;)
            poštuje vašu privatnost i posvećen je zaštiti vaših ličnih podataka. Ova politika
            privatnosti objašnjava kako prikupljamo, koristimo i štitimo vaše podatke kada koristite
            našu platformu za zakazivanje termina.
          </p>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              1. Koje podatke prikupljamo
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Prikupljamo sledeće vrste podataka:
            </p>

            <h3 className="mb-2 text-lg font-medium text-foreground">Podaci o nalogu</h3>
            <ul className="mb-4 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Ime i prezime</li>
              <li>Email adresa</li>
              <li>Lozinka (enkriptovana)</li>
              <li>Fotografija profila (opciono)</li>
              <li>Naziv salona ili poslovanja</li>
            </ul>

            <h3 className="mb-2 text-lg font-medium text-foreground">Podaci o rezervacijama</h3>
            <ul className="mb-4 space-y-2 list-disc list-inside text-muted-foreground">
              <li>Ime i prezime klijenta</li>
              <li>Email adresa klijenta</li>
              <li>Broj telefona klijenta</li>
              <li>Datum i vreme rezervacije</li>
              <li>Vrsta usluge</li>
              <li>Dodatne napomene</li>
            </ul>

            <h3 className="mb-2 text-lg font-medium text-foreground">Tehnički podaci</h3>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>IP adresa</li>
              <li>Tip pregledača i uređaja</li>
              <li>Podaci o korišćenju platforme</li>
              <li>Kolačići (vidite našu Politiku kolačića)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              2. Kako koristimo vase podatke
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Vaše podatke koristimo u sledeće svrhe:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Pružanje usluge zakazivanja termina</li>
              <li>Slanje potvrda rezervacija i podsetnika putem emaila</li>
              <li>Komunikacija u vezi sa vašim nalogom</li>
              <li>Poboljšanje naše platforme i korisničkog iskustva</li>
              <li>Analiza korišćenja platforme (u anonimizovanom obliku)</li>
              <li>Zaštita od prevara i zloupotreba</li>
              <li>Ispunjavanje zakonskih obaveza</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              3. Pravni osnov za obradu podataka
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Vaše podatke obrađujemo na osnovu:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>
                <strong>Izvrsenja ugovora</strong> - kako bismo vam pružili usluge koje ste
                zatražili
              </li>
              <li>
                <strong>Legitimnog interesa</strong> - za poboljšanje naše platforme i zaštitu od
                prevara
              </li>
              <li>
                <strong>Vaše saglasnosti</strong> - za analitičke kolačiće i marketinske
                komunikacije
              </li>
              <li>
                <strong>Zakonske obaveze</strong> - kada je obrada neophodna za ispunjavanje
                zakonskih zahteva
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">4. Deljenje podataka</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Vaše podatke ne prodajemo trećim stranama. Podatke delimo samo u sledećim situacijama:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>
                <strong>Sa pružaocima usluga</strong> - koji nam pomažu u radu platforme (hosting,
                email usluge, analitika)
              </li>
              <li>
                <strong>Između salona i klijenata</strong> - podaci o rezervaciji se dele između
                salona kod kojeg zakazujete i vas
              </li>
              <li>
                <strong>Kada je zakonom propisano</strong> - ako je to zahtevano sudskim nalogom ili
                zakonom
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">5. Čuvanje podataka</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Vaše podatke čuvamo onoliko dugo koliko je potrebno za pružanje usluga:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Podaci o nalogu - dok ne obrišete nalog</li>
              <li>Podaci o rezervacijama - 3 godine nakon rezervacije</li>
              <li>Tehnički logovi - do 12 meseci</li>
            </ul>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Nakon isteka perioda čuvanja, podaci se trajno brišu ili anonimizuju.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">6. Vaša prava</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              U skladu sa zakonima o zaštiti podataka, imate sledeća prava:
            </p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>
                <strong>Pravo pristupa</strong> - možete zatražiti kopiju vaših podataka
              </li>
              <li>
                <strong>Pravo na ispravku</strong> - možete zatražiti ispravku netačnih podataka
              </li>
              <li>
                <strong>Pravo na brisanje</strong> - možete zatražiti brisanje vaših podataka
              </li>
              <li>
                <strong>Pravo na prenosivost</strong> - možete zatražiti prenos podataka u
                strukturiranom formatu
              </li>
              <li>
                <strong>Pravo na prigovor</strong> - možete se usprotiviti obradi u određenim
                situacijama
              </li>
              <li>
                <strong>Pravo na povlačenje saglasnosti</strong> - možete povući saglasnost u bilo
                kom trenutku
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Za ostvarivanje ovih prava, kontaktirajte nas na email adresu navedenu ispod.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">7. Bezbednost podataka</h2>
            <p className="leading-relaxed text-muted-foreground">
              Preduzimamo odgovarajuće tehničke i organizacione mere za zaštitu vaših podataka,
              uključujući enkripciju podataka u prenosu (HTTPS), bezbedno čuvanje lozinki (hashing),
              redovne bezbednosne provere i ograničen pristup podacima samo ovlašćenim licima.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              8. Međunarodni prenos podataka
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Naši serveri se nalaze u Evropskoj uniji. Ako koristimo usluge provajdera van EU,
              osiguravamo da postoje odgovarajuće garancije za zaštitu vaših podataka u skladu sa
              važećim propisima.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">9. Maloletnici</h2>
            <p className="leading-relaxed text-muted-foreground">
              Naša platforma nije namenjena osobama mlađim od 16 godina. Ne prikupljamo svesno
              podatke od maloletnika. Ako saznamo da smo prikupili podatke od maloletnika, odmah
              ćemo ih obrisati.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              10. Izmene politike privatnosti
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Ova politika privatnosti može biti izmenjena povremeno. O značajnim izmenama ćemo vas
              obavestiti putem emaila ili obaveštenja na platformi. Preporučujemo da povremeno
              proverite ovu stranicu.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-foreground">11. Kontakt</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Ako imate pitanja u vezi sa ovom politikom privatnosti ili želite da ostvarite svoja
              prava, možete nas kontaktirati:
            </p>
            <ul className="space-y-2 list-none text-muted-foreground">
              <li>
                Email:{" "}
                <a href="mailto:privatnost@salonko.rs" className="text-primary hover:underline">
                  privatnost@salonko.rs
                </a>
              </li>
              <li>
                Podrška:{" "}
                <a href="mailto:salonko.rs@gmail.com" className="text-primary hover:underline">
                  salonko.rs@gmail.com
                </a>
              </li>
            </ul>
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
