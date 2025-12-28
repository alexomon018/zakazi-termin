import { getAppUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/sentry-example-page/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
