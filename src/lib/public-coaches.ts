import { getCoachCategoryLabel } from "@/lib/coach-category-catalog";
import { coaches as mockCoaches } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { CoachProfile as PublicCoachProfile, CoachReview } from "@/types/domain";

function fallbackHeroImage() {
  return mockCoaches[0]?.heroImageUrl || "https://placehold.co/1200x800/png";
}

function splitTextList(text?: string | null) {
  if (!text) return [];
  return text
    .split(/[\n,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function stripHtml(text?: string | null) {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pricingDetailsFromHtml(detailsHtml?: string | null) {
  if (!detailsHtml) return [];
  const plain = detailsHtml
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return plain.length ? plain : [stripHtml(detailsHtml)];
}

function pickPrimaryContactTarget(input: PublicCoachProfile["links"]): PublicCoachProfile["primaryContactTarget"] {
  if (input.whatsapp) return "whatsapp";
  if (input.email) return "email";
  if (input.phone) return "phone";
  if (input.web) return "web";
  if (input.linkedin) return "linkedin";
  if (input.instagram) return "instagram";
  if (input.facebook) return "facebook";
  return "mensaje";
}

function buildFirstSessionOffer(pricingDetails: string[], basePriceEur: number) {
  const explicit = pricingDetails.find((item) => /gratuita|gratis|valoraci[oó]n|inicial|diagn[oó]stico/i.test(item));
  if (explicit) return explicit;
  if (basePriceEur > 0) {
    return `Primera sesión orientativa desde ${basePriceEur} EUR para alinear objetivo, encaje y siguientes pasos.`;
  }
  return "Primer contacto para entender tu objetivo, validar encaje y acordar el siguiente paso.";
}

function buildIdealClient(input: Pick<PublicCoachProfile, "categories" | "specialties">) {
  const categoryLabel = input.categories
    .map((slug) => getCoachCategoryLabel(slug) ?? slug)
    .find(Boolean);
  const specialty = input.specialties.find(Boolean);

  if (categoryLabel && specialty) {
    return `Personas que buscan ${categoryLabel.toLowerCase()} con foco en ${specialty.toLowerCase()}.`;
  }
  if (categoryLabel) {
    return `Personas que buscan ${categoryLabel.toLowerCase()} con objetivos claros y seguimiento.`;
  }
  if (specialty) {
    return `Personas con un objetivo concreto relacionado con ${specialty.toLowerCase()}.`;
  }
  return "Personas con un objetivo concreto que quieren claridad, seguimiento y un plan accionable.";
}

function buildResponseTimeLabel(input: {
  hasDirectContact: boolean;
  primaryContactTarget?: PublicCoachProfile["primaryContactTarget"];
}) {
  if (!input.hasDirectContact) return "Respuesta por mensajería de la plataforma.";
  if (input.primaryContactTarget === "whatsapp") return "Respuesta rápida por WhatsApp o mensajería.";
  if (input.primaryContactTarget === "phone") return "Respuesta habitual en el mismo día laborable.";
  if (input.primaryContactTarget === "email") return "Respuesta habitual en 24 horas laborables.";
  return "Respuesta habitual en 24 a 48 horas laborables.";
}

function computeProfileCompleteness(coach: PublicCoachProfile) {
  const checkpoints = [
    Boolean(coach.headline?.trim()),
    Boolean(coach.bio?.trim()),
    coach.categories.length > 0,
    coach.sessionModes.length > 0,
    coach.languages.length > 0,
    coach.basePriceEur > 0,
    coach.pricingDetails.length > 0,
    Boolean(coach.heroImageUrl),
    coach.reviews.length > 0,
    Object.values(coach.links).some(Boolean),
  ];
  const completed = checkpoints.filter(Boolean).length;
  return Math.round((completed / checkpoints.length) * 100);
}

function enrichPublicCoachProfile(coach: PublicCoachProfile): PublicCoachProfile {
  const primaryContactTarget = pickPrimaryContactTarget(coach.links);
  return {
    ...coach,
    firstSessionOffer: coach.firstSessionOffer || buildFirstSessionOffer(coach.pricingDetails, coach.basePriceEur),
    idealClient: coach.idealClient || buildIdealClient(coach),
    profileCompleteness: coach.profileCompleteness ?? computeProfileCompleteness(coach),
    primaryContactTarget,
    responseTimeLabel:
      coach.responseTimeLabel ||
      buildResponseTimeLabel({
        hasDirectContact: Object.values(coach.links).some(Boolean),
        primaryContactTarget,
      }),
  };
}

type DbCoachRecord = Awaited<ReturnType<typeof listDbPublicCoachesRaw>>[number];

function mapDbCoachToPublic(coach: DbCoachRecord): PublicCoachProfile {
  const city = coach.location?.city?.trim() || "España";
  const country = coach.location?.country?.trim() || "España";
  const cityLabel = [city, country].filter(Boolean).join(", ");
  const citySlug = slugify(city) || "espana";
  const reviews: CoachReview[] = coach.reviews.map((review) => ({
    id: review.id,
    authorName: review.clientUser?.displayName || "Cliente",
    rating: review.rating?.overall ?? 5,
    title: review.title ?? undefined,
    body: review.body,
    createdAt: review.createdAt.toISOString(),
    coachDecision: review.coachDecision,
  }));

  return enrichPublicCoachProfile({
    id: coach.id,
    slug: coach.slug,
    name: coach.name,
    headline:
      coach.headline ||
      [
        coach.categories.map((item) => item.category.name).join(", "),
        cityLabel,
        coach.sessionModes.map((mode) => mode.mode).join(" y "),
      ]
        .filter(Boolean)
        .join(" · "),
    bio: coach.bio || stripHtml(coach.aboutHtml) || "Perfil de coach en proceso de completar.",
    aboutHtml: coach.aboutHtml || undefined,
    categories: coach.categories.map((item) => item.category.slug),
    citySlug,
    cityLabel,
    country,
    sessionModes: coach.sessionModes.map((mode) => mode.mode),
    languages: splitTextList(coach.languagesText),
    basePriceEur: coach.pricing?.basePriceEur ?? 0,
    pricingDetails: pricingDetailsFromHtml(coach.pricing?.detailsHtml),
    certifiedStatus: coach.certifiedStatus,
    profileStatus: coach.profileStatus,
    visibilityActive: coach.visibilityStatus === "active",
    featured: coach.featured,
    heroImageUrl: coach.heroImageUrl || coach.galleryAssets[0]?.url || fallbackHeroImage(),
    galleryImageUrls: coach.galleryAssets.map((asset) => asset.url),
    videoPresentationUrl: coach.videoPresentationUrl || undefined,
    specialties: splitTextList(coach.specialtiesText),
    links: {
      whatsapp: coach.links.find((link) => link.type === "whatsapp")?.value,
      phone: coach.links.find((link) => link.type === "phone")?.value,
      email: coach.links.find((link) => link.type === "email")?.value,
      web: coach.links.find((link) => link.type === "web")?.value,
      linkedin: coach.links.find((link) => link.type === "linkedin")?.value,
      instagram: coach.links.find((link) => link.type === "instagram")?.value,
      facebook: coach.links.find((link) => link.type === "facebook")?.value,
    },
    reviews,
    metrics: {
      totalViews: 0,
      avgViewSeconds: 0,
      clicks: {},
    },
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  });
}

async function listDbPublicCoachesRaw() {
  return prisma.coachProfile.findMany({
    where: {
      profileStatus: "published",
      visibilityStatus: "active",
    },
    include: {
      location: true,
      pricing: true,
      links: true,
      categories: {
        include: { category: true },
        orderBy: { category: { sortOrder: "asc" } },
      },
      galleryAssets: { orderBy: { sortOrder: "asc" } },
      sessionModes: true,
      reviews: {
        include: {
          rating: true,
          clientUser: { select: { displayName: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function listWpImportedCoachIds(coachIds: string[]) {
  if (!coachIds.length) return new Set<string>();
  const rows = await prisma.legacyImportMap.findMany({
    where: {
      targetTable: "CoachProfile",
      sourceType: "coach_post",
      targetId: { in: coachIds },
    },
    select: { targetId: true },
  });
  return new Set(rows.map((row) => row.targetId));
}

async function listDbPublicCoaches(): Promise<PublicCoachProfile[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await listDbPublicCoachesRaw();
    return rows.map(mapDbCoachToPublic);
  } catch (error) {
    console.warn("[public-coaches] falling back to mock data (DB query failed)", error);
    return [];
  }
}

function sortByCreatedAtDesc(list: PublicCoachProfile[]) {
  return [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function listHomeLatestCoaches(limit = 6) {
  if (!process.env.DATABASE_URL) {
    return sortByCreatedAtDesc(mockCoaches)
      .filter((coach) => coach.visibilityActive && coach.profileStatus === "published")
      .map(enrichPublicCoachProfile)
      .slice(0, limit);
  }

  try {
    const rows = await listDbPublicCoachesRaw();
    if (rows.length > 0) {
      const importedIds = await listWpImportedCoachIds(rows.map((row) => row.id));
      const mapped = rows.map(mapDbCoachToPublic);

      const prioritized =
        importedIds.size > 0
          ? [...mapped].sort((a, b) => {
              const aImported = importedIds.has(a.id) ? 1 : 0;
              const bImported = importedIds.has(b.id) ? 1 : 0;
              if (aImported !== bImported) return bImported - aImported;
              return +new Date(b.createdAt) - +new Date(a.createdAt);
            })
          : sortByCreatedAtDesc(mapped);

      return prioritized.slice(0, limit);
    }
  } catch (error) {
    console.warn("[public-coaches] home latest fallback (DB query failed)", error);
  }

  return sortByCreatedAtDesc(mockCoaches)
    .filter((coach) => coach.visibilityActive && coach.profileStatus === "published")
    .map(enrichPublicCoachProfile)
    .slice(0, limit);
}

function mergePublicCoachLists(dbCoaches: PublicCoachProfile[]) {
  if (dbCoaches.length > 0) return dbCoaches.map(enrichPublicCoachProfile);

  const bySlug = new Map<string, PublicCoachProfile>();
  for (const coach of mockCoaches) bySlug.set(coach.slug, enrichPublicCoachProfile(coach));
  for (const coach of dbCoaches) bySlug.set(coach.slug, enrichPublicCoachProfile(coach));
  return Array.from(bySlug.values()).map(enrichPublicCoachProfile);
}

export async function listPublicCoachesMerged() {
  const dbCoaches = await listDbPublicCoaches();
  return mergePublicCoachLists(dbCoaches).filter(
    (coach) => coach.visibilityActive && coach.profileStatus === "published",
  );
}

export async function getPublicCoachBySlugMerged(slug: string) {
  const all = await listPublicCoachesMerged();
  return all.find((coach) => coach.slug === slug);
}
