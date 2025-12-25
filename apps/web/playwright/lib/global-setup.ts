import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

async function globalSetup() {
  // Load test environment
  dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

  console.log("🔧 Running global setup...");

  // Wait for database to be ready
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`📦 Checking database connection (attempt ${retries + 1}/${maxRetries})...`);

      // Run Prisma db push to sync schema with test database
      execSync("yarn workspace @zakazi-termin/prisma db:push --skip-generate", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
        cwd: path.resolve(__dirname, "../../../../"),
      });

      console.log("✅ Database schema synced successfully");
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error("❌ Failed to connect to database after maximum retries");
        console.error("Make sure the test database is running: yarn test:db:start");
        throw error;
      }
      console.log("⏳ Database not ready, waiting 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("✅ Global setup completed");
}

export default globalSetup;
