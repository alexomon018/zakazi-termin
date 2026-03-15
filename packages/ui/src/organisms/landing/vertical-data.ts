import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Calendar,
  Clock,
  Gem,
  Palette,
  Scissors,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { FAQItem } from "../faq/faq-data";

export interface VerticalFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface VerticalLandingData {
  slug: string;
  // Metadata
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  // Hero
  heroHeadline: string;
  heroHighlight: string;
  heroSubheading: string;
  heroImageAlt: string;
  // Features
  featuresTitle: string;
  featuresSubtitle: string;
  features: VerticalFeature[];
  // FAQ
  faqTitle: string;
  faqDescription: string;
  faqItems: FAQItem[];
  // CTA
  ctaHeadline: string;
  ctaSubheading: string;
  // Structured data
  serviceType: string;
  serviceDescription: string;
}

export const VERTICALS: Record<string, VerticalLandingData> = {
  "frizerski-saloni": {
    slug: "frizerski-saloni",
    // Metadata
    title: "Online zakazivanje za frizerske salone",
    description:
      "Salonko omogućava frizerskim salonima i berbernicama u Srbiji da primaju online termine 24/7. Automatsko zakazivanje, podsetnici i upravljanje timom — besplatno 30 dana.",
    keywords: [
      "zakazivanje termina frizerski salon",
      "online zakazivanje frizer",
      "berbernica zakazivanje",
      "frizerski salon srbija",
      "online termini frizer",
      "zakazivanje frizera online",
      "frizerski salon online rezervacija",
      "aplikacija za frizerske salone",
      "digitalni kalendar frizer",
      "upravljanje terminima frizer",
    ],
    ogTitle: "Salonko za frizerske salone — Online zakazivanje termina",
    ogDescription:
      "Digitalizujte vaš frizerski salon. Klijenti sami zakazuju termine online, a vi dobijate više vremena za šišanje i farbanje.",
    // Hero
    heroHeadline: "Zakazivanje termina za frizerske salone,",
    heroHighlight: "bez poziva",
    heroSubheading:
      "Omogućite klijentima da sami zakazuju šišanje, farbanje i druge usluge online — 24/7. Manje propuštenih termina, manje telefonskih poziva, više zadovoljnih mušterija.",
    heroImageAlt: "Salonko - Online zakazivanje za frizerske salone",
    // Features
    featuresTitle: "Sve što vašem frizerskom salonu treba",
    featuresSubtitle:
      "Digitalizujte zakazivanje i upravljanje terminima u vašoj berbernici ili frizerskom salonu.",
    features: [
      {
        icon: Calendar,
        title: "Online zakazivanje",
        description:
          "Klijenti vide slobodne termine za šišanje, farbanje ili brijanje i sami zakazuju — bez čekanja na telefon.",
      },
      {
        icon: Scissors,
        title: "Usluge po meri",
        description:
          "Kreirajte usluge sa različitim trajanjima — muško šišanje, žensko šišanje, farbanje, feniranje, brijanje i više.",
      },
      {
        icon: Bell,
        title: "Automatski podsetnici",
        description:
          "Smanjite propuštene termine slanjem automatskih podsetnika klijentima pre zakazanog šišanja.",
      },
      {
        icon: Users,
        title: "Upravljanje timom",
        description:
          "Dodajte frizere, podesite im radno vreme i pratite zauzetost svakog člana tima.",
      },
      {
        icon: Smartphone,
        title: "Mobilni pristup",
        description:
          "Upravljajte terminima vašeg frizerskog salona sa telefona — bilo gde i bilo kada.",
      },
      {
        icon: TrendingUp,
        title: "Izveštaji",
        description:
          "Pratite najpopularnije usluge, prihode i zauzetost frizera kroz pregledne izveštaje.",
      },
    ],
    // FAQ
    faqTitle: "Pitanja za vlasnike frizerskih salona",
    faqDescription:
      "Odgovori na najčešća pitanja frizera i vlasnika berbernica o Salonko platformi.",
    faqItems: [
      {
        question: "Da li je Salonko pogodan za berbernice i frizerske salone?",
        answer:
          "Da, Salonko je dizajniran upravo za frizerske salone, berbernice i beauty studio-e. Možete kreirati usluge kao što su muško šišanje, žensko šišanje, farbanje, feniranje i mnoge druge.",
      },
      {
        question: "Kako klijenti zakazuju šišanje online?",
        answer:
          "Dobijate personalizovani link koji delite klijentima. Oni biraju uslugu (npr. šišanje ili farbanje), slobodan termin i frizera — sve bez poziva.",
      },
      {
        question: "Da li mogu da imam više frizera na platformi?",
        answer:
          "Da. Možete dodati svakog frizera kao člana tima, podesiti im individualno radno vreme i pratiti njihovu zauzetost.",
      },
      {
        question: "Koliko košta Salonko za frizerske salone?",
        answer:
          "Salonko nudi besplatan probni period od 30 dana bez kreditne kartice. Nakon toga, dostupni su pristupačni mesečni paketi prilagođeni veličini vašeg salona.",
      },
      {
        question: "Da li mogu da blokiram termine za pauze?",
        answer:
          "Da. Možete podesiti radno vreme, pauze i dane odmora. Sistem automatski prikazuje samo slobodne termine klijentima.",
      },
      {
        question: "Da li klijenti dobijaju podsetnik pre šišanja?",
        answer:
          "Da, sistem automatski šalje email podsetnike pre zakazanog termina, što značajno smanjuje broj propuštenih termina u vašem salonu.",
      },
    ],
    // CTA
    ctaHeadline: "Digitalizujte vaš frizerski salon danas",
    ctaSubheading:
      "Pridružite se frizerima koji su automatizovali zakazivanje i vratili sebi vreme za ono što vole — šišanje i zadovoljne mušterije.",
    // Structured data
    serviceType: "BarberShop",
    serviceDescription:
      "Online platforma za zakazivanje termina za frizerske salone i berbernice u Srbiji. Automatsko zakazivanje, podsetnici i upravljanje timom.",
  },
  "saloni-za-nokte": {
    slug: "saloni-za-nokte",
    // Metadata
    title: "Online zakazivanje za salone za nokte",
    description:
      "Salonko omogućava salonima za nokte i nail bar-ovima u Srbiji da primaju online termine 24/7. Automatsko zakazivanje manikira, pedikira i nail art-a — besplatno 30 dana.",
    keywords: [
      "zakazivanje termina salon za nokte",
      "nail bar zakazivanje",
      "manikir zakazivanje online",
      "salon za nokte srbija",
      "online termini nokti",
      "pedikir zakazivanje",
      "nail art zakazivanje",
      "aplikacija za salon za nokte",
      "digitalni kalendar salon za nokte",
      "upravljanje terminima nokti",
    ],
    ogTitle: "Salonko za salone za nokte — Online zakazivanje termina",
    ogDescription:
      "Digitalizujte vaš salon za nokte. Klijenti sami zakazuju manikir, pedikir i nail art online — bez poziva.",
    // Hero
    heroHeadline: "Zakazivanje termina za salone za nokte,",
    heroHighlight: "bez poziva",
    heroSubheading:
      "Omogućite klijentima da sami zakazuju manikir, pedikir, gel nokte i nail art online — 24/7. Manje propuštenih termina, više vremena za kreativnost.",
    heroImageAlt: "Salonko - Online zakazivanje za salone za nokte",
    // Features
    featuresTitle: "Sve što vašem salonu za nokte treba",
    featuresSubtitle:
      "Digitalizujte zakazivanje i upravljanje terminima u vašem nail bar-u ili salonu za nokte.",
    features: [
      {
        icon: Calendar,
        title: "Online zakazivanje",
        description:
          "Klijenti vide slobodne termine za manikir, pedikir ili nail art i sami zakazuju — bez čekanja na telefon.",
      },
      {
        icon: Gem,
        title: "Usluge po meri",
        description:
          "Kreirajte usluge sa različitim trajanjima — klasičan manikir, gel nokti, french manikir, pedikir, nail art i više.",
      },
      {
        icon: Bell,
        title: "Automatski podsetnici",
        description:
          "Smanjite propuštene termine slanjem automatskih podsetnika klijentima pre zakazanog manikira ili pedikira.",
      },
      {
        icon: Palette,
        title: "Portfolio usluga",
        description:
          "Predstavite vaše nail art radove i usluge online — klijenti vide šta nudite pre nego što zakažu.",
      },
      {
        icon: Smartphone,
        title: "Mobilni pristup",
        description:
          "Upravljajte terminima vašeg salona za nokte sa telefona — bilo gde i bilo kada.",
      },
      {
        icon: Sparkles,
        title: "Upravljanje timom",
        description:
          "Dodajte nail tehničare, podesite im radno vreme i pratite zauzetost svake manikirkinje.",
      },
    ],
    // FAQ
    faqTitle: "Pitanja za vlasnike salona za nokte",
    faqDescription:
      "Odgovori na najčešća pitanja vlasnika nail bar-ova i salona za nokte o Salonko platformi.",
    faqItems: [
      {
        question: "Da li je Salonko pogodan za salone za nokte?",
        answer:
          "Da, Salonko je idealan za salone za nokte, nail bar-ove i beauty studio-e. Možete kreirati usluge kao što su manikir, pedikir, gel nokti, french manikir, nail art i mnoge druge.",
      },
      {
        question: "Kako klijenti zakazuju manikir online?",
        answer:
          "Dobijate personalizovani link koji delite klijentima. Oni biraju uslugu (npr. manikir, pedikir ili nail art), slobodan termin i tehničara — sve bez poziva.",
      },
      {
        question: "Da li mogu da imam više nail tehničara na platformi?",
        answer:
          "Da. Možete dodati svakog tehničara kao člana tima, podesiti im individualno radno vreme i pratiti njihovu zauzetost.",
      },
      {
        question: "Koliko košta Salonko za salone za nokte?",
        answer:
          "Salonko nudi besplatan probni period od 30 dana bez kreditne kartice. Nakon toga, dostupni su pristupačni mesečni paketi prilagođeni veličini vašeg salona.",
      },
      {
        question: "Da li mogu da podesim različita trajanja za svaku uslugu?",
        answer:
          "Da. Svaka usluga može imati svoje trajanje — na primer, 45 minuta za manikir, 60 minuta za pedikir, 90 minuta za gel nokte. Sistem automatski prilagođava dostupne termine.",
      },
      {
        question: "Da li klijenti dobijaju podsetnik pre termina?",
        answer:
          "Da, sistem automatski šalje email podsetnike pre zakazanog termina, što značajno smanjuje broj propuštenih termina u vašem salonu za nokte.",
      },
    ],
    // CTA
    ctaHeadline: "Digitalizujte vaš salon za nokte danas",
    ctaSubheading:
      "Pridružite se vlasnicima salona za nokte koji su automatizovali zakazivanje i posvetili se onome što vole — savršenim noktima.",
    // Structured data
    serviceType: "NailSalon",
    serviceDescription:
      "Online platforma za zakazivanje termina za salone za nokte i nail bar-ove u Srbiji. Automatsko zakazivanje manikira, pedikira i nail art-a.",
  },
};

export const VERTICAL_SLUGS = Object.keys(VERTICALS);
