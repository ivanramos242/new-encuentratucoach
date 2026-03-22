import assert from "node:assert/strict";
import test from "node:test";
import {
  buildArticleSchema,
  buildBreadcrumbList,
  buildItemListSchema,
  buildOrganizationSchema,
  buildPersonSchema,
  buildWebsiteSchema,
} from "@/lib/seo";

test("organization and website schema expose the expected @type", () => {
  const organization = buildOrganizationSchema();
  const website = buildWebsiteSchema();

  assert.equal(organization["@type"], "Organization");
  assert.equal(website["@type"], "WebSite");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify([organization, website])));
});

test("listing and breadcrumb schema are valid JSON-LD objects", () => {
  const breadcrumb = buildBreadcrumbList([
    { name: "Inicio", path: "/" },
    { name: "Coaches", path: "/coaches" },
  ]);
  const itemList = buildItemListSchema({
    name: "Directorio de coaches",
    path: "/coaches",
    items: [{ name: "Natalia Tabella", path: "/coaches/natalia-tabella" }],
  });

  assert.equal(breadcrumb["@type"], "BreadcrumbList");
  assert.equal(itemList["@type"], "ItemList");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify([breadcrumb, itemList])));
});

test("person and article schema expose the expected @type", () => {
  const person = buildPersonSchema({
    name: "Natalia Tabella",
    description: "Coach personal en Barcelona.",
    path: "/coaches/natalia-tabella",
    areaServed: ["Barcelona", "España"],
    availableLanguage: ["Español"],
    knowsAbout: ["hábitos"],
  });
  const article = buildArticleSchema({
    headline: "Plataformas para trabajar como coach: cómo elegir (2026)",
    description: "Checklist para elegir plataforma.",
    path: "/plataformas-para-trabajar-como-coach",
    authorName: "EncuentraTuCoach",
  });

  assert.equal(person["@type"], "Person");
  assert.equal(article["@type"], "Article");
  assert.doesNotThrow(() => JSON.parse(JSON.stringify([person, article])));
});
