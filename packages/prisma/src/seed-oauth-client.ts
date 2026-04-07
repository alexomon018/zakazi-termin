import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.oAuthClient.findFirst({
    where: { name: "Salonko Mobile App" },
  });

  if (existing) {
    console.log("OAuth client already exists:");
    console.log(`  Client ID: ${existing.clientId}`);
    console.log(`  Redirect URI: ${existing.redirectUri}`);
    return;
  }

  const client = await prisma.oAuthClient.create({
    data: {
      name: "Salonko Mobile App",
      redirectUri: "salonko://oauth/callback",
      type: "PUBLIC",
      firstParty: true,
    },
  });

  console.log("Created OAuth client for Salonko Mobile App.");
  console.log(`  Client ID: ${client.clientId}`);
  console.log("");
  console.log("Add this to apps/mobile/.env:");
  console.log(`  EXPO_PUBLIC_OAUTH_CLIENT_ID=${client.clientId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
