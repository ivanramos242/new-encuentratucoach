#!/usr/bin/env node

const requiredSitemaps = [
  "/sitemap.xml",
  "/sitemap-core.xml",
  "/sitemap-coaches.xml",
  "/sitemap-landings.xml",
  "/sitemap-blog.xml",
  "/sitemap-qa-questions.xml",
  "/sitemap-qa-topics.xml",
];

function isTrue(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function ensureHttp200(baseUrl, path) {
  const target = new URL(path, baseUrl).toString();
  const response = await fetch(target, { redirect: "manual" });
  ensure(response.status === 200, `HTTP ${response.status} en ${target}`);
  return target;
}

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://encuentratucoach.es";

  const enforceGuard = process.env.SEO_ENFORCE_INDEXING_GUARD?.trim().toLowerCase() !== "false";
  const isPrimaryDomain = baseUrl.includes("encuentratucoach.es");
  if (enforceGuard && isPrimaryDomain) {
    ensure(
      isTrue(process.env.SEO_ALLOW_INDEXING),
      "SEO preflight bloqueado: SEO_ALLOW_INDEXING debe ser true en dominio principal.",
    );
  }

  if (isTrue(process.env.SEO_PREFLIGHT_SKIP_HTTP)) {
    console.log("seo-preflight: guard OK (saltando comprobaciones HTTP por SEO_PREFLIGHT_SKIP_HTTP=true).");
    return;
  }

  const checked = [];
  checked.push(await ensureHttp200(baseUrl, "/robots.txt"));
  for (const sitemapPath of requiredSitemaps) {
    checked.push(await ensureHttp200(baseUrl, sitemapPath));
  }

  console.log("seo-preflight: OK");
  for (const url of checked) {
    console.log(` - ${url}`);
  }
}

main().catch((error) => {
  console.error(`seo-preflight: ERROR -> ${error.message}`);
  process.exit(1);
});
