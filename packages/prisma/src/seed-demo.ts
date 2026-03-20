import { generateSalonSlug } from "@salonko/config";
import { hash } from "bcryptjs";
import { prisma } from "./index";

const DEMO_PASSWORD = "Demo123!";
const SALT_ROUNDS = 12;

// ── Shared attendee pool ──

const ATTENDEES = [
  { name: "Marko Petrović", email: "marko.petrovic@email.com", phone: "0641234567" },
  { name: "Jelena Nikolić", email: "jelena.nikolic@email.com", phone: "0659876543" },
  { name: "Stefan Jovanović", email: "stefan.jovanovic@email.com", phone: "0621112233" },
  { name: "Ana Đorđević", email: "ana.djordjevic@email.com", phone: "0634445566" },
  { name: "Nikola Milošević", email: "nikola.milosevic@email.com", phone: "0647778899" },
  { name: "Milica Stanković", email: "milica.stankovic@email.com", phone: "0650001122" },
  { name: "Luka Popović", email: "luka.popovic@email.com", phone: "0663334455" },
  { name: "Teodora Ilić", email: "teodora.ilic@email.com", phone: "0675556677" },
  { name: "Đorđe Marković", email: "djordje.markovic@email.com", phone: "0618889900" },
  { name: "Jovana Pavlović", email: "jovana.pavlovic@email.com", phone: "0642223344" },
];

// ── Account definitions ──

interface EventTypeDef {
  title: string;
  slug: string;
  description: string;
  length: number;
}

interface BookingDef {
  etIndex: number;
  dayOffset: number;
  hour: number;
  status: "ACCEPTED" | "PENDING" | "CANCELLED";
  attendeeIndex: number;
}

interface AccountDef {
  email: string;
  name: string;
  salonName: string;
  salonTypes: string[];
  salonPhone: string;
  salonEmail: string;
  salonCity: string;
  salonAddress: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  bio: string;
  brandColor: string;
  darkBrandColor: string;
  stripeIdSuffix: string;
  eventTypes: EventTypeDef[];
  schedules: {
    name: string;
    days: number[];
    startHour: number;
    endHour: number;
    isDefault: boolean;
  }[];
  bookings: BookingDef[];
  outOfOffice?: { dayOffsetStart: number; dayOffsetEnd: number; notes: string };
}

const BARBER_ACCOUNT: AccountDef = {
  email: "demo@salonko.app",
  name: "Marko Berberović",
  salonName: "Berbernica Kod Marka",
  salonTypes: ["barber_shop"],
  salonPhone: "0111234567",
  salonEmail: "info@berbernicakodmarka.rs",
  salonCity: "Beograd",
  salonAddress: "Knez Mihailova 25",
  ownerFirstName: "Marko",
  ownerLastName: "Berberović",
  ownerPhone: "0641234567",
  bio: "Tradicionalna berbernica u srcu Beograda. Više od 10 godina iskustva u muškom frizerstvu.",
  brandColor: "#292929",
  darkBrandColor: "#fafafa",
  stripeIdSuffix: "001",
  schedules: [
    { name: "Radno vreme", days: [1, 2, 3, 4, 5, 6], startHour: 9, endHour: 20, isDefault: true },
    { name: "Vikend raspored", days: [0, 6], startHour: 10, endHour: 16, isDefault: false },
  ],
  eventTypes: [
    {
      title: "Muško šišanje",
      slug: "musko-sisanje",
      description: "Klasično muško šišanje sa stilizovanjem",
      length: 30,
    },
    {
      title: "Brijanje",
      slug: "brijanje",
      description: "Tradicionalno brijanje brijačem",
      length: 20,
    },
    {
      title: "Šišanje + Brijanje",
      slug: "sisanje-brijanje",
      description: "Kompletna usluga šišanja i brijanja",
      length: 45,
    },
    {
      title: "Farbanje kose",
      slug: "farbanje-kose",
      description: "Profesionalno farbanje kose",
      length: 60,
    },
    {
      title: "Dečije šišanje",
      slug: "decije-sisanje",
      description: "Šišanje za decu do 12 godina",
      length: 20,
    },
  ],
  bookings: [
    { etIndex: 0, dayOffset: 1, hour: 10, status: "ACCEPTED", attendeeIndex: 0 },
    { etIndex: 1, dayOffset: 1, hour: 14, status: "ACCEPTED", attendeeIndex: 1 },
    { etIndex: 2, dayOffset: 2, hour: 11, status: "ACCEPTED", attendeeIndex: 2 },
    { etIndex: 4, dayOffset: 3, hour: 9, status: "ACCEPTED", attendeeIndex: 3 },
    { etIndex: 3, dayOffset: 1, hour: 16, status: "PENDING", attendeeIndex: 4 },
    { etIndex: 0, dayOffset: 2, hour: 15, status: "PENDING", attendeeIndex: 5 },
    { etIndex: 0, dayOffset: -3, hour: 10, status: "ACCEPTED", attendeeIndex: 6 },
    { etIndex: 1, dayOffset: -5, hour: 11, status: "ACCEPTED", attendeeIndex: 7 },
    { etIndex: 2, dayOffset: -7, hour: 14, status: "ACCEPTED", attendeeIndex: 8 },
    { etIndex: 4, dayOffset: -10, hour: 9, status: "ACCEPTED", attendeeIndex: 9 },
    { etIndex: 3, dayOffset: -4, hour: 13, status: "CANCELLED", attendeeIndex: 0 },
    { etIndex: 0, dayOffset: -6, hour: 16, status: "CANCELLED", attendeeIndex: 1 },
  ],
  outOfOffice: { dayOffsetStart: 14, dayOffsetEnd: 21, notes: "Letnji odmor - Grčka" },
};

const NAILS_ACCOUNT: AccountDef = {
  email: "demo-nails@salonko.app",
  name: "Nina Novaković",
  salonName: "Nina Nails Studio",
  salonTypes: ["salon_za_nokte"],
  salonPhone: "0112345678",
  salonEmail: "info@ninanails.rs",
  salonCity: "Novi Sad",
  salonAddress: "Bulevar Oslobođenja 42",
  ownerFirstName: "Nina",
  ownerLastName: "Novaković",
  ownerPhone: "0659991234",
  bio: "Kreativni nail art studio u centru Novog Sada. Specijalizovani za gel nokte, manikir i pedikir sa više od 8 godina iskustva.",
  brandColor: "#d4637b",
  darkBrandColor: "#f5a3b5",
  stripeIdSuffix: "002",
  schedules: [
    { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 9, endHour: 19, isDefault: true },
    { name: "Subota", days: [6], startHour: 10, endHour: 15, isDefault: false },
  ],
  eventTypes: [
    {
      title: "Gel nokti - nadogradnja",
      slug: "gel-nokti-nadogradnja",
      description: "Kompletna nadogradnja gel noktiju sa dizajnom po izboru",
      length: 90,
    },
    {
      title: "Manikir",
      slug: "manikir",
      description: "Klasičan manikir sa lakiranjem",
      length: 45,
    },
    {
      title: "Gel lak",
      slug: "gel-lak",
      description: "Trajni gel lak sa pripremom noktiju",
      length: 60,
    },
    {
      title: "Pedikir",
      slug: "pedikir",
      description: "Kompletni pedikir sa negom stopala",
      length: 60,
    },
    {
      title: "Skidanje gel noktiju",
      slug: "skidanje-gel-noktiju",
      description: "Profesionalno skidanje gel noktiju bez oštećenja",
      length: 30,
    },
    {
      title: "Nail art",
      slug: "nail-art",
      description: "Umetnički dizajn noktiju po želji",
      length: 120,
    },
  ],
  bookings: [
    { etIndex: 0, dayOffset: 1, hour: 9, status: "ACCEPTED", attendeeIndex: 1 },
    { etIndex: 2, dayOffset: 1, hour: 11, status: "ACCEPTED", attendeeIndex: 3 },
    { etIndex: 1, dayOffset: 1, hour: 14, status: "ACCEPTED", attendeeIndex: 5 },
    { etIndex: 3, dayOffset: 2, hour: 10, status: "ACCEPTED", attendeeIndex: 7 },
    { etIndex: 5, dayOffset: 2, hour: 13, status: "ACCEPTED", attendeeIndex: 9 },
    { etIndex: 0, dayOffset: 3, hour: 9, status: "PENDING", attendeeIndex: 0 },
    { etIndex: 2, dayOffset: 3, hour: 14, status: "PENDING", attendeeIndex: 2 },
    { etIndex: 0, dayOffset: -2, hour: 10, status: "ACCEPTED", attendeeIndex: 4 },
    { etIndex: 1, dayOffset: -4, hour: 13, status: "ACCEPTED", attendeeIndex: 6 },
    { etIndex: 2, dayOffset: -6, hour: 11, status: "ACCEPTED", attendeeIndex: 8 },
    { etIndex: 3, dayOffset: -8, hour: 15, status: "ACCEPTED", attendeeIndex: 0 },
    { etIndex: 5, dayOffset: -3, hour: 9, status: "CANCELLED", attendeeIndex: 2 },
    { etIndex: 4, dayOffset: -5, hour: 16, status: "CANCELLED", attendeeIndex: 4 },
  ],
  outOfOffice: { dayOffsetStart: 20, dayOffsetEnd: 25, notes: "Obuka - nail art tehnika, Milano" },
};

// ── Helpers ──

function bookingTime(dayOffset: number, hour: number, durationMinutes: number) {
  const start = new Date();
  start.setDate(start.getDate() + dayOffset);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { startTime: start, endTime: end };
}

function timeDate(hour: number): Date {
  return new Date(`1970-01-01T${String(hour).padStart(2, "0")}:00:00.000Z`);
}

// ── Core seeding function ──

async function seedAccount(account: AccountDef) {
  console.log(`\n📌 ${account.salonName}`);

  // Idempotent: delete existing user (cascade removes all related data)
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("  Deleted existing user");
  }

  const passwordHash = await hash(DEMO_PASSWORD, SALT_ROUNDS);
  const salonSlug = generateSalonSlug(account.salonName);

  // 1. Create user
  const user = await prisma.user.create({
    data: {
      email: account.email,
      name: account.name,
      salonName: account.salonName,
      salonSlug,
      salonTypes: account.salonTypes,
      salonPhone: account.salonPhone,
      salonEmail: account.salonEmail,
      salonCity: account.salonCity,
      salonAddress: account.salonAddress,
      ownerFirstName: account.ownerFirstName,
      ownerLastName: account.ownerLastName,
      ownerPhone: account.ownerPhone,
      bio: account.bio,
      brandColor: account.brandColor,
      darkBrandColor: account.darkBrandColor,
      identityProvider: "EMAIL",
      emailVerified: new Date(),
      timeZone: "Europe/Belgrade",
      locale: "sr",
      weekStart: "Monday",
      password: {
        create: { hash: passwordHash },
      },
    },
  });
  console.log("  ✅ User created");

  // 2. Subscription (ACTIVE monthly)
  const now = new Date();
  await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeCustomerId: `cus_demo_salonko_${account.stripeIdSuffix}`,
      stripeSubscriptionId: `sub_demo_salonko_${account.stripeIdSuffix}`,
      stripePriceId: "price_demo_monthly",
      status: "ACTIVE",
      billingInterval: "MONTH",
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("  ✅ Subscription created (ACTIVE)");

  // 3. Schedules
  let defaultScheduleId: string | undefined;
  for (const sched of account.schedules) {
    const schedule = await prisma.schedule.create({
      data: {
        userId: user.id,
        name: sched.name,
        timeZone: "Europe/Belgrade",
        availability: {
          create: [
            {
              days: sched.days,
              startTime: timeDate(sched.startHour),
              endTime: timeDate(sched.endHour),
              userId: user.id,
            },
          ],
        },
      },
    });
    if (sched.isDefault) {
      defaultScheduleId = schedule.id;
    }
  }

  if (defaultScheduleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { defaultScheduleId },
    });
  }
  console.log(`  ✅ Schedules created (${account.schedules.length})`);

  // 4. Event types + host records
  const location = [{ type: "inPerson", address: `${account.salonAddress}, ${account.salonCity}` }];
  const createdEventTypes: Array<{ id: string; title: string; length: number }> = [];

  for (let i = 0; i < account.eventTypes.length; i++) {
    const et = account.eventTypes[i];
    const eventType = await prisma.eventType.create({
      data: {
        userId: user.id,
        title: et.title,
        slug: et.slug,
        description: et.description,
        length: et.length,
        hidden: false,
        position: i,
        scheduleId: defaultScheduleId,
        locations: location,
        hosts: {
          create: { userId: user.id, isFixed: true },
        },
      },
    });
    createdEventTypes.push({ id: eventType.id, title: et.title, length: et.length });
  }
  console.log(`  ✅ Event types created (${account.eventTypes.length}) with host records`);

  // 5. Bookings
  let accepted = 0;
  let pending = 0;
  let cancelled = 0;
  for (const def of account.bookings) {
    const et = createdEventTypes[def.etIndex];
    const times = bookingTime(def.dayOffset, def.hour, et.length);
    const attendee = ATTENDEES[def.attendeeIndex];

    await prisma.booking.create({
      data: {
        userId: user.id,
        eventTypeId: et.id,
        title: et.title,
        startTime: times.startTime,
        endTime: times.endTime,
        status: def.status,
        attendees: {
          create: {
            name: attendee.name,
            email: attendee.email,
            phoneNumber: attendee.phone,
            timeZone: "Europe/Belgrade",
            locale: "sr",
          },
        },
      },
    });

    if (def.status === "ACCEPTED") accepted++;
    else if (def.status === "PENDING") pending++;
    else cancelled++;
  }
  console.log(
    `  ✅ Bookings created (${account.bookings.length}: ${accepted} accepted, ${pending} pending, ${cancelled} cancelled)`
  );

  // 6. Out of office
  if (account.outOfOffice) {
    const vacationReason = await prisma.outOfOfficeReason.findFirst({
      where: { reason: "Godišnji odmor" },
    });

    const reasonId =
      vacationReason?.id ??
      (
        await prisma.outOfOfficeReason.create({
          data: { emoji: "🏝️", reason: "Godišnji odmor", userId: null, enabled: true },
        })
      ).id;

    const start = new Date();
    start.setDate(start.getDate() + account.outOfOffice.dayOffsetStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() + account.outOfOffice.dayOffsetEnd);
    end.setHours(0, 0, 0, 0);

    await prisma.outOfOffice.create({
      data: { userId: user.id, start, end, notes: account.outOfOffice.notes, reasonId },
    });
    console.log("  ✅ Out of office entry created");
  }

  return { email: account.email, salonName: account.salonName, salonSlug };
}

// ── Main ──

async function main() {
  console.log("🌱 Seeding demo accounts...");

  const results = [];
  for (const account of [BARBER_ACCOUNT, NAILS_ACCOUNT]) {
    results.push(await seedAccount(account));
  }

  console.log("\n🎉 Demo accounts ready!");
  console.log(`   Password: ${DEMO_PASSWORD} (same for all)\n`);
  for (const r of results) {
    console.log(`   ${r.salonName}`);
    console.log(`     Email: ${r.email}`);
    console.log(`     Slug:  ${r.salonSlug}\n`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed demo failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
