const path = require("path");

// Load .env from monorepo root
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@zakazi-termin/auth",
    "@zakazi-termin/prisma",
    "@zakazi-termin/ui",
    "@zakazi-termin/trpc",
    "@zakazi-termin/scheduling",
    "@zakazi-termin/config",
  ],
};

module.exports = nextConfig;
