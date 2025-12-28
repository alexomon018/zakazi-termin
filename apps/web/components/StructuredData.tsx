import { getAppUrl } from "@/lib/utils";

const baseUrl = getAppUrl();

type OrganizationSchemaProps = {
  name?: string;
  description?: string;
  url?: string;
};

export function OrganizationSchema({
  name = "Salonko",
  description = "Moderna platforma za online zakazivanje termina za frizerske, kozmeticke i beauty salone u Srbiji.",
  url = baseUrl,
}: OrganizationSchemaProps = {}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description,
    url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "RSD",
      description: "Besplatno za pocetnike",
    },
    provider: {
      "@type": "Organization",
      name: "Salonko",
      url: baseUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type WebsiteSchemaProps = {
  url?: string;
  name?: string;
};

export function WebsiteSchema({
  url = baseUrl,
  name = "Salonko",
}: WebsiteSchemaProps = {}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type LocalBusinessSchemaProps = {
  name: string;
  username: string;
  avatarUrl?: string | null;
  description?: string;
};

export function LocalBusinessSchema({
  name,
  username,
  avatarUrl,
  description,
}: LocalBusinessSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url: `${baseUrl}/${username}`,
    ...(avatarUrl && { image: avatarUrl }),
    ...(description && { description }),
    "@id": `${baseUrl}/${username}`,
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type ServiceSchemaProps = {
  name: string;
  description?: string | null;
  duration: number;
  providerName: string;
  providerUsername: string;
  slug: string;
};

export function ServiceSchema({
  name,
  description,
  duration,
  providerName,
  providerUsername,
  slug,
}: ServiceSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    ...(description && { description }),
    provider: {
      "@type": "LocalBusiness",
      name: providerName,
      url: `${baseUrl}/${providerUsername}`,
    },
    areaServed: {
      "@type": "Country",
      name: "Serbia",
    },
    serviceType: name,
    url: `${baseUrl}/${providerUsername}/${slug}`,
    additionalProperty: {
      "@type": "PropertyValue",
      name: "duration",
      value: `${duration} minuta`,
    },
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type BreadcrumbSchemaProps = {
  items: Array<{
    name: string;
    url: string;
  }>;
};

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: Safe for JSON-LD structured data
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
