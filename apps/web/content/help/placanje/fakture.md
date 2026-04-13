# Pristup fakturama i istoriji plaćanja

Salonko ti omogućava da lako pregledaš i preuzmeš sve fakture za pretplatu.

## Gde pronaći fakture

Idi na **Podešavanja** > **Pretplata**. Na dnu stranice nalazi se sekcija **Istorija faktura**.

## Informacije na fakturi

Svaka faktura prikazuje:

| Kolona | Opis |
|--------|------|
| **Datum** | Datum izdavanja fakture |
| **Broj fakture** | Jedinstveni identifikator fakture |
| **Iznos** | Naplaćeni iznos u RSD |
| **Status** | Status plaćanja (plaćeno, čeka naplatu, neuspelo) |

## Pregled i preuzimanje

Za svaku fakturu imaš dve opcije:

- **Pogledaj** — Otvara detaljnu fakturu na Stripe stranici u novom tabu
- **PDF** — Preuzima fakturu u PDF formatu direktno na tvoj uređaj

## Istorija

Prikazuje se poslednjih **24 faktura**. Za starije fakture, koristi Stripe portal koji je dostupan klikom na **Upravljaj načinom plaćanja**.

## Statusi fakture

- **Plaćeno** — Uspešno naplaćeno
- **Otvoreno** — Čeka naplatu
- **Neuspelo** — Naplata nije uspela (proveri podatke o kartici)
- **Draft** — Faktura u pripremi

## Neuspelo plaćanje

Ako plaćanje ne uspe:

1. Proverićeš email za obaveštenje o neuspeloj naplati
2. Idi na **Upravljaj načinom plaćanja** da ažuriraš podatke o kartici
3. Stripe će automatski pokušati ponovo naplatu
4. Ako naplata ne uspe nakon više pokušaja, pretplata može biti suspendovana

## Za knjigovodstvo

Fakture sadrže sve potrebne informacije za evidenciju:
- Iznos sa PDV-om
- Datum i broj fakture
- Detalji pretplate

> **Saveti:** Preuzmi PDF fakture redovno i čuvaj ih za svoju dokumentaciju. Možeš ih proslediti svom knjigovođi direktno.

![Istorija faktura](/images/help/invoice-history.png)
