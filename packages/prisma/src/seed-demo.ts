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

interface SubscriptionDef {
  status: "ACTIVE" | "TRIALING" | "EXPIRED";
  /** Only needed for ACTIVE */
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  billingInterval?: "MONTH" | "YEAR";
  /** Only needed for TRIALING */
  trialStartedAt?: Date;
  trialEndsAt?: Date;
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
  subscription?: SubscriptionDef;
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
    // Weekdays only; Saturday/Sunday use "Vikend raspored" (no overlapping day 6).
    { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 9, endHour: 20, isDefault: true },
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

// ── Team account definitions ──

interface TeamMemberDef {
  email: string;
  name: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPhone: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  eventTypes: EventTypeDef[];
  bookings: BookingDef[];
  schedules: {
    name: string;
    days: number[];
    startHour: number;
    endHour: number;
    isDefault: boolean;
  }[];
}

interface TeamAccountDef {
  organizationName: string;
  salonTypes: string[];
  salonPhone: string;
  salonEmail: string;
  salonCity: string;
  salonAddress: string;
  bio: string;
  brandColor: string;
  darkBrandColor: string;
  stripeIdSuffix: string;
  subscription?: SubscriptionDef;
  members: TeamMemberDef[];
  outOfOffice?: {
    memberIndex: number;
    dayOffsetStart: number;
    dayOffsetEnd: number;
    notes: string;
  };
}

const BEAUTY_TEAM: TeamAccountDef = {
  organizationName: "Beauty Studio Bella",
  salonTypes: ["kozmeticki_salon"],
  salonPhone: "0114567890",
  salonEmail: "info@beautybella.rs",
  salonCity: "Beograd",
  salonAddress: "Terazije 12",
  bio: "Profesionalni kozmetički studio sa timom iskusnih terapeuta. Tretmani lica, tela i masaže.",
  brandColor: "#9b59b6",
  darkBrandColor: "#c39bd3",
  stripeIdSuffix: "010",
  members: [
    {
      email: "demo-team-owner@salonko.app",
      name: "Ivana Marić",
      ownerFirstName: "Ivana",
      ownerLastName: "Marić",
      ownerPhone: "0641001001",
      role: "OWNER",
      schedules: [
        { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 9, endHour: 20, isDefault: true },
        { name: "Subota", days: [6], startHour: 10, endHour: 16, isDefault: false },
      ],
      eventTypes: [
        {
          title: "Tretman lica - osnovni",
          slug: "tretman-lica-osnovni",
          description: "Dubinsko čišćenje i hidratacija lica",
          length: 60,
        },
        {
          title: "Anti-age tretman",
          slug: "anti-age-tretman",
          description: "Kompletni anti-age tretman sa serumima i maskama",
          length: 90,
        },
      ],
      bookings: [
        { etIndex: 0, dayOffset: 1, hour: 10, status: "ACCEPTED", attendeeIndex: 0 },
        { etIndex: 1, dayOffset: 2, hour: 14, status: "ACCEPTED", attendeeIndex: 2 },
        { etIndex: 0, dayOffset: 3, hour: 11, status: "PENDING", attendeeIndex: 4 },
        { etIndex: 0, dayOffset: -2, hour: 9, status: "ACCEPTED", attendeeIndex: 6 },
        { etIndex: 1, dayOffset: -5, hour: 15, status: "CANCELLED", attendeeIndex: 8 },
      ],
    },
    {
      email: "demo-team-admin@salonko.app",
      name: "Milena Todorović",
      ownerFirstName: "Milena",
      ownerLastName: "Todorović",
      ownerPhone: "0641002002",
      role: "ADMIN",
      schedules: [
        { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 10, endHour: 19, isDefault: true },
      ],
      eventTypes: [
        {
          title: "Masaža - relaks",
          slug: "masaza-relaks",
          description: "Opuštajuća masaža celog tela",
          length: 60,
        },
        {
          title: "Masaža - sportska",
          slug: "masaza-sportska",
          description: "Sportska masaža za oporavak mišića",
          length: 45,
        },
      ],
      bookings: [
        { etIndex: 0, dayOffset: 1, hour: 12, status: "ACCEPTED", attendeeIndex: 1 },
        { etIndex: 1, dayOffset: 1, hour: 15, status: "ACCEPTED", attendeeIndex: 3 },
        { etIndex: 0, dayOffset: 2, hour: 10, status: "PENDING", attendeeIndex: 5 },
        { etIndex: 1, dayOffset: -3, hour: 14, status: "ACCEPTED", attendeeIndex: 7 },
        { etIndex: 0, dayOffset: -7, hour: 11, status: "CANCELLED", attendeeIndex: 9 },
      ],
    },
    {
      email: "demo-team-member@salonko.app",
      name: "Sara Vuković",
      ownerFirstName: "Sara",
      ownerLastName: "Vuković",
      ownerPhone: "0641003003",
      role: "MEMBER",
      schedules: [
        { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 9, endHour: 17, isDefault: true },
      ],
      eventTypes: [
        {
          title: "Depilacija - noge",
          slug: "depilacija-noge",
          description: "Depilacija nogu voskom",
          length: 30,
        },
        {
          title: "Depilacija - bikini",
          slug: "depilacija-bikini",
          description: "Depilacija bikini zone",
          length: 20,
        },
      ],
      bookings: [
        { etIndex: 0, dayOffset: 1, hour: 9, status: "ACCEPTED", attendeeIndex: 0 },
        { etIndex: 1, dayOffset: 2, hour: 13, status: "ACCEPTED", attendeeIndex: 2 },
        { etIndex: 0, dayOffset: 3, hour: 15, status: "PENDING", attendeeIndex: 4 },
        { etIndex: 0, dayOffset: -4, hour: 10, status: "ACCEPTED", attendeeIndex: 6 },
      ],
    },
  ],
  outOfOffice: {
    memberIndex: 1,
    dayOffsetStart: 10,
    dayOffsetEnd: 14,
    notes: "Edukacija - nove tehnike masaže",
  },
};

const EXPIRED_ACCOUNT: AccountDef = {
  email: "demo-expired@salonko.app",
  name: "Petar Petrović",
  salonName: "Salon Petar",
  salonTypes: ["frizerski_salon"],
  salonPhone: "0113456789",
  salonEmail: "info@salonpetar.rs",
  salonCity: "Niš",
  salonAddress: "Obrenovićeva 15",
  ownerFirstName: "Petar",
  ownerLastName: "Petrović",
  ownerPhone: "0641239876",
  bio: "Frizerski salon sa dugom tradicijom u centru Niša.",
  brandColor: "#6b7280",
  darkBrandColor: "#9ca3af",
  stripeIdSuffix: "003",
  subscription: { status: "EXPIRED" },
  schedules: [
    { name: "Radno vreme", days: [1, 2, 3, 4, 5], startHour: 9, endHour: 18, isDefault: true },
  ],
  eventTypes: [
    {
      title: "Šišanje",
      slug: "sisanje",
      description: "Klasično šišanje",
      length: 30,
    },
    {
      title: "Farbanje",
      slug: "farbanje",
      description: "Farbanje kose",
      length: 60,
    },
  ],
  bookings: [
    { etIndex: 0, dayOffset: -10, hour: 10, status: "ACCEPTED", attendeeIndex: 0 },
    { etIndex: 1, dayOffset: -15, hour: 14, status: "ACCEPTED", attendeeIndex: 1 },
  ],
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

  // 2. Subscription
  const now = new Date();
  const sub = account.subscription ?? {
    status: "ACTIVE" as const,
    stripeSubscriptionId: `sub_demo_salonko_${account.stripeIdSuffix}`,
    stripePriceId: "price_demo_monthly",
    billingInterval: "MONTH" as const,
  };

  await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeCustomerId: `cus_demo_salonko_${account.stripeIdSuffix}`,
      status: sub.status,
      ...(sub.status === "ACTIVE" && {
        stripeSubscriptionId: sub.stripeSubscriptionId,
        stripePriceId: sub.stripePriceId,
        billingInterval: sub.billingInterval,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      }),
      ...(sub.status === "TRIALING" && {
        trialStartedAt: sub.trialStartedAt,
        trialEndsAt: sub.trialEndsAt,
      }),
      ...(sub.status === "EXPIRED" && {
        currentPeriodStart: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      }),
    },
  });
  console.log(`  ✅ Subscription created (${sub.status})`);

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

// ── Team seeding function ──

async function seedTeamAccount(team: TeamAccountDef) {
  console.log(`\n📌 ${team.organizationName} (team)`);

  const passwordHash = await hash(DEMO_PASSWORD, SALT_ROUNDS);
  const salonSlug = generateSalonSlug(team.organizationName);

  // Idempotent: delete existing users and organization
  for (const member of team.members) {
    const existing = await prisma.user.findUnique({ where: { email: member.email } });
    if (existing) {
      await prisma.user.delete({ where: { id: existing.id } });
      console.log(`  Deleted existing user ${member.email}`);
    }
  }
  const existingOrg = await prisma.organization.findUnique({ where: { slug: salonSlug } });
  if (existingOrg) {
    // Delete any remaining users linked to this org (orphans from prior seeds)
    const previousMembers = await prisma.membership.findMany({
      where: { organizationId: existingOrg.id },
      select: { userId: true },
    });
    if (previousMembers.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: previousMembers.map(({ userId }) => userId) } },
      });
      console.log(`  Deleted ${previousMembers.length} orphaned user(s) from previous seed`);
    }
    await prisma.organization.delete({ where: { id: existingOrg.id } });
    console.log("  Deleted existing organization");
  }

  // 1. Create organization
  const organization = await prisma.organization.create({
    data: { name: team.organizationName, slug: salonSlug },
  });
  console.log("  ✅ Organization created");

  const owner = team.members.find((m) => m.role === "OWNER");
  const location = [{ type: "inPerson", address: `${team.salonAddress}, ${team.salonCity}` }];

  // 2. Create each team member
  for (const member of team.members) {
    const isOwner = member.role === "OWNER";

    const user = await prisma.user.create({
      data: {
        email: member.email,
        name: member.name,
        // Only OWNER gets salon-level fields
        salonName: isOwner ? team.organizationName : null,
        salonSlug: isOwner ? salonSlug : null,
        salonTypes: isOwner ? team.salonTypes : [],
        salonPhone: isOwner ? team.salonPhone : null,
        salonEmail: isOwner ? team.salonEmail : null,
        salonCity: isOwner ? team.salonCity : null,
        salonAddress: isOwner ? team.salonAddress : null,
        ownerFirstName: member.ownerFirstName,
        ownerLastName: member.ownerLastName,
        ownerPhone: member.ownerPhone,
        bio: isOwner ? team.bio : null,
        brandColor: isOwner ? team.brandColor : "#292929",
        darkBrandColor: isOwner ? team.darkBrandColor : "#fafafa",
        identityProvider: "EMAIL",
        emailVerified: new Date(),
        timeZone: "Europe/Belgrade",
        locale: "sr",
        weekStart: "Monday",
        password: { create: { hash: passwordHash } },
      },
    });

    // 3. Create membership
    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: member.role,
        accepted: true,
      },
    });
    console.log(`  ✅ ${member.name} created (${member.role})`);

    // 4. Subscription (only OWNER gets the subscription)
    if (isOwner) {
      const now = new Date();
      const sub = team.subscription ?? {
        status: "ACTIVE" as const,
        stripeSubscriptionId: `sub_demo_salonko_${team.stripeIdSuffix}`,
        stripePriceId: "price_demo_monthly",
        billingInterval: "MONTH" as const,
      };

      await prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: `cus_demo_salonko_${team.stripeIdSuffix}`,
          status: sub.status,
          ...(sub.status === "ACTIVE" && {
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripePriceId: sub.stripePriceId,
            billingInterval: sub.billingInterval,
            currentPeriodStart: now,
            currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          }),
        },
      });
      console.log(`  ✅ Subscription created (${sub.status})`);
    }

    // 5. Schedules
    let defaultScheduleId: string | undefined;
    for (const sched of member.schedules) {
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

    // 6. Event types (belong to both user AND organization)
    const createdEventTypes: Array<{ id: string; title: string; length: number }> = [];
    for (let i = 0; i < member.eventTypes.length; i++) {
      const et = member.eventTypes[i];
      const eventType = await prisma.eventType.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          title: et.title,
          slug: et.slug,
          description: et.description,
          length: et.length,
          hidden: false,
          position: i,
          scheduleId: defaultScheduleId,
          locations: location,
          hosts: { create: { userId: user.id, isFixed: true } },
        },
      });
      createdEventTypes.push({ id: eventType.id, title: et.title, length: et.length });
    }
    console.log(`  ✅ Event types created (${member.eventTypes.length}) for ${member.name}`);

    // 7. Bookings
    let accepted = 0;
    let pending = 0;
    let cancelled = 0;
    for (const def of member.bookings) {
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
      `  ✅ Bookings created (${member.bookings.length}: ${accepted} accepted, ${pending} pending, ${cancelled} cancelled) for ${member.name}`
    );

    // 8. Out of office (if this member has one)
    if (team.outOfOffice && team.members[team.outOfOffice.memberIndex].email === member.email) {
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
      start.setDate(start.getDate() + team.outOfOffice.dayOffsetStart);
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setDate(end.getDate() + team.outOfOffice.dayOffsetEnd);
      end.setHours(0, 0, 0, 0);

      await prisma.outOfOffice.create({
        data: { userId: user.id, start, end, notes: team.outOfOffice.notes, reasonId },
      });
      console.log(`  ✅ Out of office entry created for ${member.name}`);
    }
  }

  return {
    organizationName: team.organizationName,
    salonSlug,
    members: team.members.map((m) => ({ email: m.email, name: m.name, role: m.role })),
  };
}

// ── Main ──

async function main() {
  console.log("🌱 Seeding demo accounts...");

  const soloResults = [];
  for (const account of [BARBER_ACCOUNT, NAILS_ACCOUNT, EXPIRED_ACCOUNT]) {
    soloResults.push(await seedAccount(account));
  }

  const teamResult = await seedTeamAccount(BEAUTY_TEAM);

  console.log("\n🎉 Demo accounts ready!");
  console.log(`   Password: ${DEMO_PASSWORD} (same for all)\n`);

  console.log("   ── Solo accounts ──");
  for (const r of soloResults) {
    console.log(`   ${r.salonName}`);
    console.log(`     Email: ${r.email}`);
    console.log(`     Slug:  ${r.salonSlug}\n`);
  }

  console.log("   ── Team account ──");
  console.log(`   ${teamResult.organizationName} (slug: ${teamResult.salonSlug})`);
  for (const m of teamResult.members) {
    console.log(`     ${m.role.padEnd(6)} ${m.name} — ${m.email}`);
  }
  console.log();
}

main()
  .catch((e) => {
    console.error("❌ Seed demo failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
