import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./playwright",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: isCI ? 60000 : 60000,
  expect: {
    timeout: isCI ? 15000 : 10000,
  },

  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/payment/**", // Payment tests run in separate project
    },
    {
      name: "chromium-payment",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "**/payment/**/*.e2e.ts",
      fullyParallel: false, // Run payment tests serially to avoid race conditions
    },
  ],

  webServer: {
    command: "yarn dev",
    url: "http://localhost:3000",
    // Always start fresh server to ensure correct test database is used
    // Previous: reuseExistingServer: !isCI (would reuse dev server with wrong DB)
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    },
  },

  globalSetup: "./playwright/lib/global-setup.ts",
  globalTeardown: "./playwright/lib/global-teardown.ts",
});
