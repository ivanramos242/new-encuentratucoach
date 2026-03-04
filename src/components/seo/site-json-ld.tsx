import { getSiteBaseUrl, siteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/seo/json-ld";

export function SiteJsonLd() {
  const baseUrl = getSiteBaseUrl();

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}#organization`,
        name: siteConfig.name,
        url: baseUrl,
        logo: `${baseUrl}/site-logo.png`,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`,
        name: siteConfig.name,
        url: baseUrl,
        inLanguage: "es-ES",
        publisher: { "@id": `${baseUrl}#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${baseUrl}/coaches?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return <JsonLd data={graph} />;
}
