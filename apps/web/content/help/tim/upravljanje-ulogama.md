# Upravljanje ulogama i dozvolama

Salonko koristi sistem uloga da bi odredio šta svaki član tima može da radi. Razumevanje razlika između uloga ti pomaže da pravilno organizuješ pristup.

## Dostupne uloge

### Vlasnik

Vlasnik je osoba koja je kreirala salon na Salonko platformi.

**Može da:**
- Upravlja svim aspektima salona
- Poziva nove članove
- Menja uloge ostalih članova
- Uklanja bilo kog člana
- Pristupa podešavanjima pretplate i plaćanja
- Briše salon

**Ograničenja:**
- Može biti samo jedan vlasnik po organizaciji
- Uloga vlasnika se ne može preneti na drugog člana
- Vlasnik ne može sam sebe ukloniti iz tima

### Administrator

Administratori imaju prošireni pristup za upravljanje timom.

**Može da:**
- Poziva nove članove (sa ulogom Član)
- Uklanja članove sa ulogom Član
- Upravlja svojim rasporedom i terminima
- Pristupa kontrolnoj tabli salona

**Ne može da:**
- Poziva ili uklanja druge administratore
- Menja uloge članova
- Pristupa podešavanjima pretplate

### Član

Članovi imaju osnovni pristup za svakodnevni rad.

**Može da:**
- Upravlja svojim rasporedom rada
- Vidi i upravlja terminima koji su mu dodeljeni
- Pristupa kontrolnoj tabli salona

**Ne može da:**
- Poziva ili uklanja druge članove
- Menja bilo čija podešavanja osim svojih

## Promena uloge

Samo vlasnik može menjati uloge ostalih članova:

1. Idi na **Podešavanja** > **Tim**
2. Pronađi člana na listi
3. Klikni na padajući meni pored uloge
4. Izaberi novu ulogu (Član ili Administrator)

Promena je trenutna i ne zahteva potvrdu od člana čija se uloga menja.

## Uklanjanje člana

Da ukloniš člana tima:

1. Pronađi člana na listi tima
2. Klikni na **Ukloni člana** (crveno dugme)
3. Potvrdi uklanjanje

### Ko može koga da ukloni

| Ko uklanja | Koga može ukloniti |
|------------|---------------------|
| Vlasnik | Administratore i članove |
| Administrator | Samo članove |
| Član | Nikoga |

> **Napomena:** Niko ne može ukloniti samog sebe, niti iko može ukloniti vlasnika.

## Preporuke za organizaciju

- **Mali salon (2-3 osobe):** Vlasnik + Članovi je dovoljno
- **Srednji salon (4-8 osoba):** Vlasnik + 1 Administrator + Članovi — administrator može pomagati sa pozivanjem i upravljanjem
- **Veći salon (8+ osoba):** Vlasnik + 2-3 Administratora + Članovi — raspodeli odgovornost za upravljanje timom

![Pregled uloga u timu](/images/help/team-roles.png)

![Promena uloge člana tima](/images/help/change-role.png)
