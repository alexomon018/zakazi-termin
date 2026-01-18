export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQCategory {
  title: string;
  description: string;
  items: FAQItem[];
}

export const generalFAQs: FAQItem[] = [
  {
    question: "Da li je korišćenje Salonko platforme besplatno?",
    answer:
      "Salonko nudi besplatan probni period od 30 dana. Nakon toga, platforma je dostupna kroz mesečnu pretplatu koja omogućava pristup digitalnom kalendaru, upravljanju uslugama, online zakazivanjima i naprednim funkcijama.",
  },
  {
    question: "Kako mogu da registrujem svoj profil na Salonko?",
    answer:
      'Klikni na dugme "Započni besplatno", popuni osnovne podatke i kreiraj svoj nalog. Proces traje manje od tri minuta, a nakon aktivacije odmah možeš da upravljaš kalendarom, uslugama i terminima.',
  },
  {
    question: "Da li klijenti mogu da biraju tačno koji termin žele?",
    answer:
      "Da. Klijenti vide tvoju dostupnost u realnom vremenu i sami biraju termin koji im odgovara. Ti definišeš svoje radno vreme i trajanje usluga, a sistem automatski prikazuje slobodne termine.",
  },
  {
    question: "Da li mi je potrebna posebna oprema?",
    answer:
      "Ne. Salonko možeš koristiti na telefonu, tabletu ili računaru - potreban ti je samo pristup internetu. Bez instalacija, direktno iz pregledača.",
  },
  {
    question: "Koliko brzo mogu da počnem da primam online rezervacije?",
    answer:
      "Odmah nakon kreiranja naloga. Čim se registruješ i podeliš svoj link za zakazivanje, klijenti mogu da rezervišu termine.",
  },
  {
    question: "Šta ako mi treba pomoć tokom korišćenja?",
    answer:
      "Možeš nas kontaktirati putem emaila na salonko.rs@gmail.com. Naš tim uvek odgovara u najkraćem roku.",
  },
];

export const salonOwnerFAQs: FAQItem[] = [
  {
    question: "Kako funkcioniše online zakazivanje?",
    answer:
      "Dobijaš personalizovani link koji možeš podeliti sa klijentima. Oni vide tvoju dostupnost i sami biraju termin. Ti dobijaš notifikaciju o svakoj novoj rezervaciji.",
  },
  {
    question: "Mogu li da imam više tipova usluga?",
    answer:
      "Da. Možeš kreirati neograničen broj različitih usluga sa različitim trajanjima i opisima. Svaka usluga ima svoj kalendar dostupnosti.",
  },
  {
    question: "Da li mogu da blokiram određene termine?",
    answer:
      "Da. Možeš podesiti svoje radno vreme, pauze, i označiti dane kada nisi dostupan. Sistem automatski prikazuje samo slobodne termine klijentima.",
  },
  {
    question: "Kako mogu da otkažem ili pomeram termine?",
    answer:
      "Iz svog dashboard-a možeš jednostavno otkazati ili pomeriti bilo koji termin. Klijent automatski dobija obaveštenje o promeni.",
  },
  {
    question: "Da li klijenti dobijaju podsetnik za termin?",
    answer:
      "Da. Sistem automatski šalje email podsetnike klijentima pre zakazanog termina, što značajno smanjuje broj propuštenih termina.",
  },
  {
    question: "Mogu li da vidim istoriju rezervacija?",
    answer:
      "Da. U dashboard-u imaš kompletan pregled svih prošlih i budućih termina, sa detaljima o klijentima i uslugama.",
  },
];

export const clientFAQs: FAQItem[] = [
  {
    question: "Kako da zakažem termin?",
    answer:
      "Klikni na link za zakazivanje koji ti je podelio pružalac usluge, izaberi željenu uslugu, odaberi slobodan termin iz kalendara i potvrdi rezervaciju unosom svojih podataka.",
  },
  {
    question: "Da li moram da kreiram nalog da bih zakazao termin?",
    answer:
      "Ne. Za zakazivanje termina nije potrebna registracija - samo uneseš svoje ime i email adresu prilikom rezervacije.",
  },
  {
    question: "Kako mogu da otkažem ili promenim termin?",
    answer:
      "U email potvrdi koju dobiješ nakon zakazivanja nalazi se link za upravljanje terminom. Preko njega možeš otkazati ili pomeriti rezervaciju.",
  },
  {
    question: "Da li ću dobiti potvrdu rezervacije?",
    answer:
      "Da. Odmah nakon zakazivanja dobijaš email sa svim detaljima termina, kao i podsetnik pre samog termina.",
  },
];

export const faqCategories: FAQCategory[] = [
  {
    title: "Često postavljena pitanja",
    description:
      "Kratki odgovori na najčešća pitanja naših korisnika. Ako ti nešto i dalje nije jasno, uvek nam možeš pisati.",
    items: generalFAQs,
  },
  {
    title: "Pitanja za vlasnike",
    description:
      "Odgovori na sve što treba da znaš pre nego što počneš da koristiš Salonko za svoje poslovanje.",
    items: salonOwnerFAQs,
  },
  {
    title: "Pitanja za klijente",
    description: "Sve što klijenti treba da znaju o zakazivanju termina.",
    items: clientFAQs,
  },
];

// Subset for homepage - most common questions
export const homepageFAQs: FAQItem[] = [
  generalFAQs[0], // Da li je besplatno
  generalFAQs[1], // Kako da se registrujem
  generalFAQs[2], // Da li klijenti biraju termin
  generalFAQs[4], // Koliko brzo mogu da primam rezervacije
  salonOwnerFAQs[0], // Kako funkcioniše online zakazivanje
  salonOwnerFAQs[4], // Da li klijenti dobijaju podsetnik
];
