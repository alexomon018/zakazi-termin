import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/sentry-example-page/"],
    },
    sitemap: "https://salonko.rs/sitemap.xml",
  };
}
