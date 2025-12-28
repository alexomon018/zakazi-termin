type OrganizationSchemaProps = {
  name?: string;
  description?: string;
  url?: string;
};

export function OrganizationSchema({
  name = "Salonko",
  description = "Moderna platforma za online zakazivanje termina za frizerske, kozmeticke i beauty salone u Srbiji.",
  url = "https://salonko.rs",
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
      url: "https://salonko.rs",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type WebsiteSchemaProps = {
  url?: string;
  name?: string;
};

export function WebsiteSchema({
  url = "https://salonko.rs",
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
    url: `https://salonko.rs/${username}`,
    ...(avatarUrl && { image: avatarUrl }),
    ...(description && { description }),
    "@id": `https://salonko.rs/${username}`,
  };

  return (
    <script
      type="application/ld+json"
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
      url: `https://salonko.rs/${providerUsername}`,
    },
    areaServed: {
      "@type": "Country",
      name: "Serbia",
    },
    serviceType: name,
    url: `https://salonko.rs/${providerUsername}/${slug}`,
    additionalProperty: {
      "@type": "PropertyValue",
      name: "duration",
      value: `${duration} minuta`,
    },
  };

  return (
    <script
      type="application/ld+json"
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
