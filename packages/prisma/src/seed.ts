import { prisma } from "./index";

/**
 * Seeds the database with a set of default global Out of Office reasons.
 *
 * Performs an upsert for each predefined reason using the reason string as the unique key:
 * existing records have their `emoji` updated; missing records are created with `userId` set to `null` (global) and `enabled` set to `true`.
 */
async function main() {
  console.log("🌱 Seeding database...");

  // Seed default Out of Office reasons
  const defaultReasons = [
    { emoji: "🏝️", reason: "Godišnji odmor" },
    { emoji: "🏠", reason: "Rad od kuće" },
    { emoji: "🤒", reason: "Bolovanje" },
    { emoji: "✈️", reason: "Putovanje" },
    { emoji: "📚", reason: "Obuka/Konferencija" },
    { emoji: "👨‍👩‍👧‍👦", reason: "Porodične obaveze" },
    { emoji: "🎄", reason: "Praznici" },
    { emoji: "📅", reason: "Lični razlozi" },
  ];

  for (const reasonData of defaultReasons) {
    await prisma.outOfOfficeReason.upsert({
      where: {
        reason: reasonData.reason,
      },
      update: {
        emoji: reasonData.emoji,
      },
      create: {
        emoji: reasonData.emoji,
        reason: reasonData.reason,
        userId: null, // Global reason
        enabled: true,
      },
    });
  }

  console.log("✅ Seeded Out of Office reasons");
  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });