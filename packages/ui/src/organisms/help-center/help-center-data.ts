import type { LucideIcon } from "lucide-react";
import { BookOpen, CalendarCheck, CreditCard, Palette, Settings, Users } from "lucide-react";

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
}

export interface HelpCategory {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  articles: HelpArticle[];
}

export const helpCategories: HelpCategory[] = [
  {
    id: "pocetak",
    icon: BookOpen,
    title: "Početak rada",
    description: "Sve što treba da znaš da bi počeo/la sa korišćenjem Salonko platforme.",
    articles: [
      {
        id: "kreiranje-naloga",
        title: "Kako da kreiraš nalog na Salonko platformi",
        description:
          "Vodič korak po korak za registraciju salona na Salonko platformi — od popunjavanja podataka i verifikacije emaila do prvog prijavljivanja na kontrolnu tablu.",
      },
      {
        id: "podesavanje-profila",
        title: "Podešavanje profila salona",
        description:
          "Saznaj kako da dodaš naziv salona, opis, fotografiju profila i kontakt informacije da bi tvoja stranica za zakazivanje izgledala profesionalno.",
      },
      {
        id: "prvi-tip-dogadjaja",
        title: "Kreiranje prvog tipa usluge",
        description:
          "Kako da napraviš svoj prvi tip usluge na Salonko platformi — podesi naziv, trajanje, lokaciju i opis da klijenti mogu da zakazuju termine.",
      },
      {
        id: "deljenje-linka",
        title: "Deljenje linka za zakazivanje sa klijentima",
        description:
          "Pronađi i podeli svoj personalizovani link za zakazivanje na društvenim mrežama, Instagramu, sajtu ili direktno klijentima putem poruke.",
      },
    ],
  },
  {
    id: "zakazivanje",
    icon: CalendarCheck,
    title: "Zakazivanje i termini",
    description: "Upravljanje terminima, otkazivanje i promena rasporeda.",
    articles: [
      {
        id: "kako-klijenti-zakazuju",
        title: "Kako klijenti zakazuju termin",
        description:
          "Detaljan pregled procesa zakazivanja iz perspektive klijenta — od izbora usluge i termina, preko popunjavanja podataka, do potvrde rezervacije.",
      },
      {
        id: "upravljanje-rezervacijama",
        title: "Upravljanje rezervacijama u kontrolnoj tabli",
        description:
          "Kako da pregledaš, prihvatiš ili otkazaš dolazeće rezervacije u Salonko kontrolnoj tabli. Filtriraj po statusu i upravljaj terminima na jednom mestu.",
      },
      {
        id: "otkazivanje-i-pomeranje",
        title: "Otkazivanje i pomeranje termina",
        description:
          "Saznaj kako funkcioniše otkazivanje termina na Salonko platformi — i za vlasnike salona i za klijente koji žele da promene ili zakazuju novi termin.",
      },
      {
        id: "neradni-dani",
        title: "Podešavanje neradnih dana i odmora",
        description:
          "Blokiraj dane kada nisi dostupan/na za zakazivanje — postavi neradne dane, godišnje odmore i praznike da se termini automatski ne prikazuju.",
      },
    ],
  },
  {
    id: "tim",
    icon: Users,
    title: "Tim i osoblje",
    description: "Dodavanje članova tima, individualni rasporedi i dodela usluga.",
    articles: [
      {
        id: "dodavanje-clanova",
        title: "Kako dodati članove tima",
        description:
          "Pozovi zaposlene u salon putem email pozivnice, podesi im uloge i pristup kontrolnoj tabli da mogu samostalno da upravljaju svojim rasporedom.",
      },
      {
        id: "individualni-rasporedi",
        title: "Podešavanje individualnih rasporeda",
        description:
          "Svaki član tima može imati sopstveni raspored rada, pauze i neradne dane. Saznaj kako da podesiš individualne rasporede za zaposlene u salonu.",
      },
      {
        id: "dodela-usluga",
        title: "Dodela usluga članovima tima",
        description:
          "Odredi koji zaposleni pružaju koje usluge u salonu — klijenti će moći da biraju željenog člana tima pri zakazivanju određene usluge.",
      },
      {
        id: "upravljanje-ulogama",
        title: "Upravljanje ulogama i dozvolama",
        description:
          "Razlike između uloga vlasnika, administratora i člana tima na Salonko platformi. Saznaj ko ima pristup kojim funkcijama i podešavanjima.",
      },
    ],
  },
  {
    id: "raspolozivost",
    icon: Settings,
    title: "Raspoloživost i raspored",
    description: "Podešavanje radnog vremena, pauza i posebnih rasporeda.",
    articles: [
      {
        id: "radno-vreme",
        title: "Podešavanje radnog vremena",
        description:
          "Kako da definišeš radne dane i sate za ceo salon na Salonko platformi — podesi kada si dostupan/na za zakazivanje i koliko traju pauze.",
      },
      {
        id: "vise-rasporeda",
        title: "Kreiranje više rasporeda",
        description:
          "Koristi različite rasporede za različite periode godine, dane u nedelji ili tipove usluga. Saznaj kako da kreiraš i dodeliš više rasporeda.",
      },
      {
        id: "izuzeci-datuma",
        title: "Dodavanje izuzetaka za specifične datume",
        description:
          "Promeni radno vreme za praznike, posebne prilike ili jednokratne događaje. Saznaj kako da dodaš izuzetke koji preklapaju tvoj redovni raspored.",
      },
      {
        id: "vremenska-zona",
        title: "Podešavanje vremenske zone",
        description:
          "Kako se termini automatski prikazuju klijentima u njihovoj vremenskoj zoni. Podesi svoju zonu i osiguraj da su svi termini tačno usklađeni.",
      },
    ],
  },
  {
    id: "placanje",
    icon: CreditCard,
    title: "Plaćanje i pretplata",
    description: "Upravljanje pretplatom, fakturama i načinima plaćanja.",
    articles: [
      {
        id: "planovi-i-cene",
        title: "Pregled planova i cena",
        description:
          "Uporedi Salonko planove pretplate — saznaj šta je uključeno u svaki plan, koliko košta mesečna pretplata i koji plan najbolje odgovara tvom salonu.",
      },
      {
        id: "probni-period",
        title: "Kako funkcioniše probni period",
        description:
          "Saznaj sve o besplatnom probnom periodu na Salonko platformi — koliko traje, šta je uključeno, i šta se dešava kada probni period istekne.",
      },
      {
        id: "promena-plana",
        title: "Promena ili otkazivanje pretplate",
        description:
          "Kako da nadogradiš plan na viši nivo, smanjiš pretplatu ili potpuno otkazaš. Saznaj šta se dešava sa tvojim podacima nakon otkazivanja.",
      },
      {
        id: "fakture",
        title: "Pristup fakturama i istoriji plaćanja",
        description:
          "Gde možeš da preuzmeš fakture za sve uplate, pregledaš istoriju transakcija i pronađeš detalje o svakom plaćanju na Salonko platformi.",
      },
    ],
  },
  {
    id: "personalizacija",
    icon: Palette,
    title: "Personalizacija",
    description: "Prilagodi izgled stranice za zakazivanje svom brendu.",
    articles: [
      {
        id: "boja-brenda",
        title: "Promena boje brenda",
        description:
          "Podesi primarnu boju brenda koja se koristi na tvojoj stranici za zakazivanje — uskladi izgled sa vizuelnim identitetom svog salona.",
      },
      {
        id: "tamni-rezim",
        title: "Tamni i svetli režim",
        description:
          "Prebaci između tamnog i svetlog režima u Salonko kontrolnoj tabli. Saznaj kako tema utiče na tvoje radno okruženje i stranicu za zakazivanje.",
      },
      {
        id: "prilagodjena-stranica",
        title: "Prilagođavanje stranice za zakazivanje",
        description:
          "Kako izgleda tvoja javna stranica za zakazivanje, šta klijenti vide i kako možeš da prilagodiš izgled sa bojom brenda i informacijama salona.",
      },
    ],
  },
];

export const supportCategories = [
  { value: "tehnicka-podrska", label: "Tehnička podrška" },
  { value: "placanje", label: "Plaćanje i pretplata" },
  { value: "nalog", label: "Problem sa nalogom" },
  { value: "funkcionalnost", label: "Zahtev za novu funkcionalnost" },
  { value: "bug", label: "Prijava greške" },
  { value: "ostalo", label: "Ostalo" },
] as const;

export type SupportCategoryValue = (typeof supportCategories)[number]["value"];
