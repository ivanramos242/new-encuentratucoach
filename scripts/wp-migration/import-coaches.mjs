import fs from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseArgs(argv) {
  const out = {
    file: "coaches-export-2026-02-24-160302.json",
    commit: false,
    verbose: false,
    mediaFrom: "",
    mediaTo: "",
    sourceSystem: "wordpress",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--commit") {
      out.commit = true;
      continue;
    }
    if (token === "--dry-run") {
      out.commit = false;
      continue;
    }
    if (token === "--verbose") {
      out.verbose = true;
      continue;
    }
    if (token === "--file") {
      out.file = argv[i + 1] || out.file;
      i += 1;
      continue;
    }
    if (token === "--media-from") {
      out.mediaFrom = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (token === "--media-to") {
      out.mediaTo = argv[i + 1] || "";
      i += 1;
      continue;
    }
    if (!token.startsWith("--") && out.file === "coaches-export-2026-02-24-160302.json") {
      out.file = token;
    }
  }
  return out;
}

function hasMojibake(value) {
  return typeof value === "string" && /Ã|Â|â€™|â€œ|â€\u009d|â€"|â€\u0094|â€¦/.test(value);
}

function repairText(value) {
  if (typeof value !== "string") return value;
  if (!hasMojibake(value)) return value;
  try {
    return Buffer.from(value, "latin1").toString("utf8");
  } catch {
    return value;
  }
}

function cleanString(value) {
  const repaired = repairText(typeof value === "string" ? value : String(value ?? ""));
  const trimmed = repaired.trim();
  return trimmed || null;
}

function slugify(value) {
  const base = repairText(String(value || ""))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "coach";
}

function stripHtml(html) {
  return repairText(String(html || ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function inferBio(postExcerpt, postContent) {
  const excerpt = cleanString(postExcerpt);
  if (excerpt) return excerpt;
  const plain = stripHtml(postContent || "");
  if (!plain) return null;
  return plain.length > 240 ? `${plain.slice(0, 237).trim()}...` : plain;
}

function parseWpDate(value) {
  const text = cleanString(value);
  if (!text) return null;
  const normalized = text.includes("T") ? text : text.replace(" ", "T");
  const iso = normalized.endsWith("Z") ? normalized : `${normalized}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parsePriceEur(value) {
  const text = cleanString(value);
  if (!text) return null;
  const normalized = text.replace(",", ".").replace(/[^\d.]/g, "");
  const num = Number.parseFloat(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num);
}

function parseLocation(locationField) {
  const first = Array.isArray(locationField) ? locationField.find((v) => cleanString(v)) : locationField;
  const raw = cleanString(first);
  if (!raw) return null;
  const parts = raw
    .split(",")
    .map((p) => cleanString(p))
    .filter(Boolean);
  if (!parts.length) return null;

  const looksCountry = (v) => /espana|españa/i.test(v);
  let city = parts[0];
  let province = null;
  let country = "España";

  if (parts.length === 2) {
    if (looksCountry(parts[1])) {
      country = parts[1];
    } else {
      province = parts[1];
    }
  } else if (parts.length >= 3) {
    province = parts.slice(1, -1).join(", ");
    country = parts.at(-1);
  }

  return {
    city,
    province,
    country: country || "España",
  };
}

function parseSessionModes(rawModes) {
  const values = Array.isArray(rawModes) ? rawModes : rawModes ? [rawModes] : [];
  const out = new Set();
  for (const raw of values) {
    const text = repairText(String(raw || "")).toLowerCase();
    if (text.includes("online")) out.add("online");
    if (text.includes("presencial")) out.add("presencial");
  }
  return Array.from(out);
}

function parseCertificado(raw) {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return values.some((v) => /certificado/i.test(repairText(String(v || "")))) ? "approved" : "none";
}

function parseWpMediaObjectUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return cleanString(value);
  if (typeof value === "object") return cleanString(value.url || value.URL);
  return null;
}

function rewriteMediaUrl(url, args) {
  const normalized = cleanString(url);
  if (!normalized) return null;
  if (!args.mediaFrom || !args.mediaTo) return normalized;
  const from = args.mediaFrom.replace(/\/+$/, "");
  const to = args.mediaTo.replace(/\/+$/, "");
  return normalized.startsWith(from) ? `${to}${normalized.slice(from.length)}` : normalized;
}

function parseGalleryUrls(galeria, args) {
  if (!galeria || typeof galeria !== "object") return [];
  const keys = Object.keys(galeria).sort((a, b) => a.localeCompare(b, "es"));
  const urls = [];
  for (const key of keys) {
    const value = galeria[key];
    const url = rewriteMediaUrl(parseWpMediaObjectUrl(value), args);
    if (url) urls.push(url);
  }
  return Array.from(new Set(urls)).slice(0, 8);
}

function normalizePhone(value) {
  const text = cleanString(value);
  if (!text) return null;
  const digits = text.replace(/[^\d+]/g, "");
  return digits || text;
}

function normalizeWhatsapp(value) {
  const text = cleanString(value);
  if (!text) return null;
  return text.replace(/[^\d+]/g, "") || text;
}

function buildLinks(acf) {
  const links = [];
  const email = cleanString(acf?.Correo_Electronico);
  const phoneRaw = cleanString(acf?.Telefono_);
  const whatsappRaw = cleanString(acf?.whatsapp);
  const web = cleanString(acf?.pagina_web);
  const linkedin = cleanString(acf?.linkedin);
  const instagram = cleanString(acf?.instagram);
  const facebook = cleanString(acf?.facebook);

  if (email) links.push({ type: "email", value: email });
  if (web) links.push({ type: "web", value: web });
  if (linkedin) links.push({ type: "linkedin", value: linkedin });
  if (instagram) links.push({ type: "instagram", value: instagram });
  if (facebook) links.push({ type: "facebook", value: facebook });

  const phone = normalizePhone(phoneRaw);
  const whatsapp = normalizeWhatsapp(whatsappRaw);
  if (phone) links.push({ type: "phone", value: phone });
  if (whatsapp) links.push({ type: "whatsapp", value: whatsapp });
  if (!whatsapp && phoneRaw && /whatsapp/i.test(phoneRaw)) {
    const inferred = normalizeWhatsapp(phoneRaw);
    if (inferred) links.push({ type: "whatsapp", value: inferred });
  }

  const seen = new Set();
  return links.filter((link) => {
    const key = `${link.type}:${link.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCategoryRows(item) {
  const rows = Array.isArray(item?.taxonomies?.coaches_category) ? item.taxonomies.coaches_category : [];
  const dedupe = new Map();
  for (const row of rows) {
    const slug = cleanString(row?.slug) ? slugify(row.slug) : slugify(row?.name || "categoria");
    const name = cleanString(row?.name) || slug;
    if (!dedupe.has(slug)) {
      dedupe.set(slug, {
        slug,
        name,
        sortOrder: Number.isFinite(Number(row?.term_id)) ? Number(row.term_id) : 9999,
      });
    }
  }
  return Array.from(dedupe.values());
}

function mapWpStatusToPlatform(wpStatus) {
  const status = String(wpStatus || "").toLowerCase();
  if (status === "publish") {
    return { profileStatus: "published", visibilityStatus: "active" };
  }
  if (status === "pending") {
    return { profileStatus: "draft", visibilityStatus: "inactive" };
  }
  return { profileStatus: "draft", visibilityStatus: "inactive" };
}

async function ensureUniqueCoachSlug(baseSlug, exceptId) {
  const normalized = slugify(baseSlug);
  let candidate = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.coachProfile.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === exceptId) return candidate;
    candidate = `${normalized}-${i++}`;
  }
}

async function upsertLocation(tx, location) {
  const city = cleanString(location?.city);
  if (!city) return null;
  const province = cleanString(location?.province);
  const country = cleanString(location?.country) || "España";
  const slug = slugify(`${city} ${country}`);
  const existing = await tx.coachLocation.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return existing.id;
  const created = await tx.coachLocation.create({
    data: { city, province, country, slug },
    select: { id: true },
  });
  return created.id;
}

function parseExport(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.items)) {
    throw new Error("Formato no valido. Se esperaba un objeto con items[].");
  }
  return {
    siteUrl: cleanString(json.site_url),
    postType: cleanString(json.post_type),
    exportedAt: cleanString(json.exported_at),
    items: json.items,
  };
}

function sanitizeBrokenJsonText(raw) {
  if (typeof raw !== "string") return { text: raw, removed: 0 };
  // Strip control chars that are invalid inside JSON string literals and commonly appear after terminal paste.
  const invalidControlChars = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
  let removed = 0;
  const text = raw.replace(invalidControlChars, () => {
    removed += 1;
    return "";
  });
  return { text, removed };
}

function parseJsonWithPasteRecovery(raw, filePath) {
  try {
    return { data: JSON.parse(raw), sanitized: false, removedControlChars: 0 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Bad control character in string literal/i.test(message)) {
      throw error;
    }

    const sanitized = sanitizeBrokenJsonText(raw);
    if (!sanitized.removed) {
      throw error;
    }

    try {
      const data = JSON.parse(sanitized.text);
      console.warn(
        `[wp-coaches-import] Aviso: se detectaron ${sanitized.removed} caracteres de control invalidos en ${filePath}. ` +
          "Se han eliminado automaticamente (posible corrupcion al pegar el JSON en la terminal).",
      );
      return { data, sanitized: true, removedControlChars: sanitized.removed };
    } catch (sanitizedError) {
      const sanitizedMessage = sanitizedError instanceof Error ? sanitizedError.message : String(sanitizedError);
      throw new Error(
        `No se pudo parsear el JSON (${filePath}) ni tras sanitizar caracteres de control. ` +
          `Error original: ${message}. Error tras sanitizar: ${sanitizedMessage}`,
      );
    }
  }
}

async function loadExistingLegacyMap() {
  return prisma.legacyImportMap.findMany({
    where: { sourceSystem: "wordpress", sourceType: "coach_post" },
    select: { sourceId: true, targetId: true },
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = path.resolve(process.cwd(), args.file);
  const raw = await fs.readFile(filePath, "utf8");
  const parsedJson = parseJsonWithPasteRecovery(raw, filePath);
  const exportJson = parseExport(parsedJson.data);

  if (exportJson.postType && exportJson.postType !== "coaches") {
    throw new Error(`El export no parece de coaches (post_type=${exportJson.postType}).`);
  }
  if (args.commit && !process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL. Para --commit necesitas conexion a la base de datos.");
  }

  const items = exportJson.items;
  const summary = {
    mode: args.commit ? "commit" : "dry-run",
    filePath,
    exportedAt: exportJson.exportedAt,
    siteUrl: exportJson.siteUrl,
    totalRows: items.length,
    candidateRows: 0,
    invalidRows: 0,
    created: 0,
    updated: 0,
    legacyMapped: 0,
    wpStatusCounts: {},
    platformStatusCounts: { published_active: 0, draft_inactive: 0 },
    categoryUpserts: 0,
    warnings: 0,
    jsonSanitized: parsedJson.sanitized,
    jsonControlCharsRemoved: parsedJson.removedControlChars,
  };

  const warnings = [];
  const legacyBySourceId = new Map();
  if (process.env.DATABASE_URL) {
    const maps = await loadExistingLegacyMap();
    for (const row of maps) legacyBySourceId.set(row.sourceId, row.targetId);
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const post = item?.post || {};
    const acf = item?.acf || {};

    const wpId = String(post.ID || "").trim();
    const name = cleanString(post.post_title);
    if (!wpId || !name) {
      summary.invalidRows += 1;
      warnings.push({ index, wpId: wpId || null, reason: "Falta post.ID o post_title" });
      continue;
    }
    summary.candidateRows += 1;

    const wpStatus = String(post.post_status || "").toLowerCase() || "unknown";
    summary.wpStatusCounts[wpStatus] = (summary.wpStatusCounts[wpStatus] || 0) + 1;
    const mappedStatuses = mapWpStatusToPlatform(wpStatus);
    if (mappedStatuses.profileStatus === "published" && mappedStatuses.visibilityStatus === "active") {
      summary.platformStatusCounts.published_active += 1;
    } else {
      summary.platformStatusCounts.draft_inactive += 1;
    }

    const sourceSlug = cleanString(post.post_name) || slugify(name);
    const rawContent = typeof post.post_content === "string" ? repairText(post.post_content) : "";
    const rawExcerpt = typeof post.post_excerpt === "string" ? repairText(post.post_excerpt) : "";
    const categoryRows = buildCategoryRows(item);
    const sessionModes = parseSessionModes(acf.Tipo_de_Sesion);
    const location = parseLocation(acf.Ubicacion);
    const featuredImageUrl = rewriteMediaUrl(item?.featured_image?.url, args);
    const galleryUrls = parseGalleryUrls(acf.galeria, args);
    const videoUrl = rewriteMediaUrl(parseWpMediaObjectUrl(acf.video_presentacion), args);
    const pricingBase = parsePriceEur(acf.precio_unico);
    const pricingDetailsHtml = typeof acf.precio_sesion === "string" ? repairText(acf.precio_sesion) : null;
    const links = buildLinks(acf);
    const certifiedStatus = parseCertificado(acf.certificado);
    const languagesText = cleanString(acf.idiomas);
    const specialtiesText = cleanString(acf.especialidades);
    const gender = cleanString(acf.genero);
    const createdAt = parseWpDate(post.post_date) || new Date();
    const updatedAt = parseWpDate(post.post_modified) || createdAt;
    const publishedAt = mappedStatuses.profileStatus === "published" ? createdAt : null;

    if (!args.commit) {
      const existingId = legacyBySourceId.get(wpId);
      if (existingId) summary.updated += 1;
      else summary.created += 1;
      if (existingId) summary.legacyMapped += 1;

      if (args.verbose) {
        console.log("[wp-coaches-import][dry-run]", {
          wpId,
          slug: sourceSlug,
          name,
          wpStatus,
          mappedStatuses,
          categories: categoryRows.map((c) => c.slug),
          hasFeatured: Boolean(featuredImageUrl),
          galleryCount: galleryUrls.length,
          hasVideo: Boolean(videoUrl),
        });
      }
      continue;
    }

    const existingMappedCoachId = legacyBySourceId.get(wpId) || null;

    let targetCoach = null;
    if (existingMappedCoachId) {
      targetCoach = await prisma.coachProfile.findUnique({
        where: { id: existingMappedCoachId },
        select: { id: true, slug: true },
      });
      summary.legacyMapped += 1;
    }
    if (!targetCoach) {
      targetCoach = await prisma.coachProfile.findUnique({
        where: { slug: sourceSlug },
        select: { id: true, slug: true },
      });
    }

    const finalSlug = await ensureUniqueCoachSlug(sourceSlug, targetCoach?.id);

    await prisma.$transaction(async (tx) => {
      for (const category of categoryRows) {
        await tx.coachCategory.upsert({
          where: { slug: category.slug },
          create: {
            slug: category.slug,
            name: category.name,
            isActive: true,
            sortOrder: category.sortOrder,
          },
          update: {
            name: category.name,
            isActive: true,
          },
        });
      }
      summary.categoryUpserts += categoryRows.length;

      const locationId = location ? await upsertLocation(tx, location) : null;
      const headline = [
        categoryRows.map((c) => c.name).join(", "),
        location ? [location.city, location.country].filter(Boolean).join(", ") : null,
        sessionModes.length ? sessionModes.join(" y ") : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const coachProfile = targetCoach
        ? await tx.coachProfile.update({
            where: { id: targetCoach.id },
            data: {
              slug: finalSlug,
              name,
              headline: headline || null,
              bio: inferBio(rawExcerpt, rawContent),
              aboutHtml: rawContent || null,
              gender,
              locationId,
              certifiedStatus,
              profileStatus: mappedStatuses.profileStatus,
              visibilityStatus: mappedStatuses.visibilityStatus,
              heroImageUrl: featuredImageUrl,
              videoPresentationUrl: videoUrl,
              specialtiesText,
              languagesText,
              publishedAt,
            },
            select: { id: true },
          })
        : await tx.coachProfile.create({
            data: {
              slug: finalSlug,
              name,
              headline: headline || null,
              bio: inferBio(rawExcerpt, rawContent),
              aboutHtml: rawContent || null,
              gender,
              locationId,
              certifiedStatus,
              profileStatus: mappedStatuses.profileStatus,
              visibilityStatus: mappedStatuses.visibilityStatus,
              heroImageUrl: featuredImageUrl,
              videoPresentationUrl: videoUrl,
              specialtiesText,
              languagesText,
              publishedAt,
              createdAt,
              updatedAt,
            },
            select: { id: true },
          });

      const coachProfileId = coachProfile.id;

      await tx.coachPricing.upsert({
        where: { coachProfileId },
        create: {
          coachProfileId,
          basePriceEur: pricingBase,
          detailsHtml: pricingDetailsHtml || null,
        },
        update: {
          basePriceEur: pricingBase,
          detailsHtml: pricingDetailsHtml || null,
        },
      });

      await tx.coachProfileSessionMode.deleteMany({ where: { coachProfileId } });
      if (sessionModes.length) {
        await tx.coachProfileSessionMode.createMany({
          data: sessionModes.map((mode) => ({ coachProfileId, mode })),
          skipDuplicates: true,
        });
      }

      await tx.coachLink.deleteMany({ where: { coachProfileId } });
      if (links.length) {
        await tx.coachLink.createMany({
          data: links.map((link) => ({
            coachProfileId,
            type: link.type,
            value: link.value,
            isPrimary: link.type === "email" || link.type === "whatsapp",
          })),
          skipDuplicates: true,
        });
      }

      await tx.coachGalleryAsset.deleteMany({ where: { coachProfileId } });
      if (galleryUrls.length) {
        await tx.coachGalleryAsset.createMany({
          data: galleryUrls.map((url, idx) => ({
            coachProfileId,
            url,
            sortOrder: idx,
          })),
        });
      }

      await tx.coachProfileCategory.deleteMany({ where: { coachProfileId } });
      if (categoryRows.length) {
        const categories = await tx.coachCategory.findMany({
          where: { slug: { in: categoryRows.map((c) => c.slug) } },
          select: { id: true, slug: true },
        });
        if (categories.length) {
          await tx.coachProfileCategory.createMany({
            data: categories.map((cat) => ({ coachProfileId, categoryId: cat.id })),
            skipDuplicates: true,
          });
        }
      }

      await tx.legacyImportMap.upsert({
        where: {
          sourceSystem_sourceType_sourceId: {
            sourceSystem: args.sourceSystem,
            sourceType: "coach_post",
            sourceId: wpId,
          },
        },
        create: {
          sourceSystem: args.sourceSystem,
          sourceType: "coach_post",
          sourceId: wpId,
          targetTable: "CoachProfile",
          targetId: coachProfileId,
          payload: {
            wpPostId: post.ID ?? null,
            wpPostAuthor: post.post_author ?? null,
            wpStatus,
            wpSlug: post.post_name ?? null,
            wpPermalink: post.permalink ?? null,
            sourceFeaturedImageUrl: item?.featured_image?.url ?? null,
            sourceVideoUrl: parseWpMediaObjectUrl(acf.video_presentacion),
            sourceGalleryUrls: parseGalleryUrls(acf.galeria, { ...args, mediaFrom: "", mediaTo: "" }),
            sourceEmail: acf?.Correo_Electronico ?? null,
            sourceUserIdField: acf?.user_id ?? null,
            importedAt: new Date().toISOString(),
          },
        },
        update: {
          targetId: coachProfileId,
          payload: {
            wpPostId: post.ID ?? null,
            wpPostAuthor: post.post_author ?? null,
            wpStatus,
            wpSlug: post.post_name ?? null,
            wpPermalink: post.permalink ?? null,
            sourceFeaturedImageUrl: item?.featured_image?.url ?? null,
            sourceVideoUrl: parseWpMediaObjectUrl(acf.video_presentacion),
            sourceGalleryUrls: parseGalleryUrls(acf.galeria, { ...args, mediaFrom: "", mediaTo: "" }),
            sourceEmail: acf?.Correo_Electronico ?? null,
            sourceUserIdField: acf?.user_id ?? null,
            importedAt: new Date().toISOString(),
          },
        },
      });
    });

    if (targetCoach) summary.updated += 1;
    else summary.created += 1;

    if (args.verbose) {
      console.log("[wp-coaches-import][commit]", {
        wpId,
        slug: finalSlug,
        name,
        wpStatus,
        mappedStatuses,
        categories: categoryRows.map((c) => c.slug),
      });
    }
  }

  summary.warnings = warnings.length;
  console.log(JSON.stringify(summary, null, 2));
  if (warnings.length && args.verbose) {
    console.log("[wp-coaches-import] warnings");
    console.log(JSON.stringify(warnings, null, 2));
  }
  if (!args.commit) {
    console.log("\nDry-run completado. Para aplicar cambios usa --commit.");
  }
}

main()
  .catch((error) => {
    console.error("Error en importacion de coaches WP:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
