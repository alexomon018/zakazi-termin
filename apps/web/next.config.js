const path = require("path");
const { withBetterStack } = require("@logtail/next");

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = withBetterStack(nextConfig);
