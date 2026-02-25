import { prisma } from "@/lib/prisma";
import { coaches as mockCoaches } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";
import type { CoachProfile as PublicCoachProfile, CoachReview } from "@/types/domain";

function fallbackHeroImage() {
  return mockCoaches[0]?.heroImageUrl || "https://placehold.co/1200x800/png";
}

function splitTextList(text?: string | null) {
  if (!text) return [];
  return text
    .split(/[\n,;]+/)
    .map((v) => v.trim())
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
    .map((v) => v.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return plain.length ? plain : [stripHtml(detailsHtml)];
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

  return {
    id: coach.id,
    slug: coach.slug,
    name: coach.name,
    headline:
      coach.headline ||
      [
        coach.categories.map((item) => item.category.name).join(", "),
        cityLabel,
        coach.sessionModes.map((m) => m.mode).join(" y "),
      ]
        .filter(Boolean)
        .join(" · "),
    bio: coach.bio || stripHtml(coach.aboutHtml) || "Perfil de coach en proceso de completar.",
    aboutHtml: coach.aboutHtml || undefined,
    categories: coach.categories.map((item) => item.category.slug),
    citySlug,
    cityLabel,
    country,
    sessionModes: coach.sessionModes.map((m) => m.mode),
    languages: splitTextList(coach.languagesText),
    basePriceEur: coach.pricing?.basePriceEur ?? 0,
    pricingDetails: pricingDetailsFromHtml(coach.pricing?.detailsHtml),
    certifiedStatus: coach.certifiedStatus,
    profileStatus: coach.profileStatus,
    visibilityActive: coach.visibilityStatus === "active",
    featured: coach.featured,
    heroImageUrl: coach.heroImageUrl || coach.galleryAssets[0]?.url || fallbackHeroImage(),
    galleryImageUrls: coach.galleryAssets.map((a) => a.url),
    videoPresentationUrl: coach.videoPresentationUrl || undefined,
    specialties: splitTextList(coach.specialtiesText),
    links: {
      whatsapp: coach.links.find((l) => l.type === "whatsapp")?.value,
      phone: coach.links.find((l) => l.type === "phone")?.value,
      email: coach.links.find((l) => l.type === "email")?.value,
      web: coach.links.find((l) => l.type === "web")?.value,
      linkedin: coach.links.find((l) => l.type === "linkedin")?.value,
      instagram: coach.links.find((l) => l.type === "instagram")?.value,
      facebook: coach.links.find((l) => l.type === "facebook")?.value,
    },
    reviews,
    metrics: {
      totalViews: 0,
      avgViewSeconds: 0,
      clicks: {},
    },
    createdAt: coach.createdAt.toISOString(),
    updatedAt: coach.updatedAt.toISOString(),
  };
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
    .slice(0, limit);
}

function mergePublicCoachLists(dbCoaches: PublicCoachProfile[]) {
  if (dbCoaches.length > 0) return dbCoaches;
  const bySlug = new Map<string, PublicCoachProfile>();
  for (const coach of mockCoaches) bySlug.set(coach.slug, coach);
  for (const coach of dbCoaches) bySlug.set(coach.slug, coach);
  return Array.from(bySlug.values());
}

export async function listPublicCoachesMerged() {
  const dbCoaches = await listDbPublicCoaches();
  return mergePublicCoachLists(dbCoaches).filter((coach) => coach.visibilityActive && coach.profileStatus === "published");
}

export async function getPublicCoachBySlugMerged(slug: string) {
  const all = await listPublicCoachesMerged();
  return all.find((coach) => coach.slug === slug);
}
