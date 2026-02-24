import type { CoachLinkType, SessionMode, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth-session";

type CoachProfileSaveInput = {
  coachProfileId?: string;
  name?: string;
  headline?: string | null;
  bio?: string | null;
  aboutHtml?: string | null;
  gender?: string | null;
  specialtiesText?: string | null;
  languagesText?: string | null;
  heroImageUrl?: string | null;
  videoPresentationUrl?: string | null;
  location?: { city: string; province?: string | null; country?: string | null } | null;
  sessionModes?: SessionMode[];
  pricing?: { basePriceEur?: number | null; detailsHtml?: string | null; notes?: string | null } | null;
  links?: Partial<Record<CoachLinkType, string | null>>;
  galleryUrls?: string[];
};

async function uniqueCoachSlug(base: string, exceptId?: string) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.coachProfile.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === exceptId) return slug;
    slug = `${normalized}-${i++}`;
  }
}

async function ensureOwnedCoachProfile(sessionUser: SessionUser, coachProfileId?: string) {
  if (sessionUser.role !== "coach" && sessionUser.role !== "admin") {
    throw new Error("No autorizado para gestionar perfil de coach");
  }

  if (coachProfileId) {
    const profile = await prisma.coachProfile.findUnique({
      where: { id: coachProfileId },
      select: { id: true, userId: true, slug: true },
    });
    if (!profile) throw new Error("Perfil de coach no encontrado");
    if (sessionUser.role !== "admin" && profile.userId !== sessionUser.id) {
      throw new Error("No tienes acceso a este perfil");
    }
    return profile.id;
  }

  if (sessionUser.coachProfileId) return sessionUser.coachProfileId;

  if (sessionUser.role !== "coach") throw new Error("El admin debe indicar coachProfileId");

  const name = sessionUser.displayName?.trim() || sessionUser.email.split("@")[0] || "Coach";
  const slug = await uniqueCoachSlug(name);
  const created = await prisma.coachProfile.create({
    data: {
      userId: sessionUser.id,
      name,
      slug,
      profileStatus: "draft",
      visibilityStatus: "inactive",
      certifiedStatus: "none",
    },
    select: { id: true },
  });
  return created.id;
}

async function upsertLocation(location: NonNullable<CoachProfileSaveInput["location"]>) {
  const city = location.city.trim();
  const province = location.province?.trim() || null;
  const country = location.country?.trim() || "España";
  const slugBase = [city, country].filter(Boolean).join(" ");
  const slug = slugify(slugBase);

  const existing = await prisma.coachLocation.findUnique({ where: { slug } });
  if (existing) return existing.id;

  const created = await prisma.coachLocation.create({
    data: { city, province, country, slug },
    select: { id: true },
  });
  return created.id;
}

export async function getCoachProfileForEditor(sessionUser: SessionUser) {
  if (sessionUser.role !== "coach" && sessionUser.role !== "admin") return null;
  const coachProfileId = sessionUser.coachProfileId;
  if (!coachProfileId) return null;
  return prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    include: {
      location: true,
      pricing: true,
      links: true,
      galleryAssets: { orderBy: { sortOrder: "asc" } },
      sessionModes: true,
      subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
}

export async function saveCoachProfile(sessionUser: SessionUser, input: CoachProfileSaveInput) {
  const coachProfileId = await ensureOwnedCoachProfile(sessionUser, input.coachProfileId);
  const locationId = input.location ? await upsertLocation(input.location) : null;

  const current = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { id: true, slug: true, userId: true },
  });
  if (!current) throw new Error("Perfil de coach no encontrado");

  const nextName = input.name?.trim() || undefined;
  const nextSlug = nextName ? await uniqueCoachSlug(nextName, current.id) : undefined;

  await prisma.$transaction(async (tx) => {
    await tx.coachProfile.update({
      where: { id: coachProfileId },
      data: {
        name: nextName,
        slug: nextSlug,
        headline: input.headline?.trim() || null,
        bio: input.bio?.trim() || null,
        aboutHtml: input.aboutHtml?.trim() || null,
        gender: input.gender?.trim() || null,
        specialtiesText: input.specialtiesText?.trim() || null,
        languagesText: input.languagesText?.trim() || null,
        heroImageUrl: input.heroImageUrl?.trim() || null,
        videoPresentationUrl: input.videoPresentationUrl?.trim() || null,
        locationId,
        messagingEnabled: true,
      },
    });

    if (input.sessionModes) {
      await tx.coachProfileSessionMode.deleteMany({ where: { coachProfileId } });
      if (input.sessionModes.length) {
        await tx.coachProfileSessionMode.createMany({
          data: input.sessionModes.map((mode) => ({ coachProfileId, mode })),
          skipDuplicates: true,
        });
      }
    }

    if (input.pricing) {
      await tx.coachPricing.upsert({
        where: { coachProfileId },
        create: {
          coachProfileId,
          basePriceEur: input.pricing.basePriceEur ?? null,
          detailsHtml: input.pricing.detailsHtml?.trim() || null,
          notes: input.pricing.notes?.trim() || null,
        },
        update: {
          basePriceEur: input.pricing.basePriceEur ?? null,
          detailsHtml: input.pricing.detailsHtml?.trim() || null,
          notes: input.pricing.notes?.trim() || null,
        },
      });
    }

    if (input.links) {
      const allowedTypes: CoachLinkType[] = ["web", "linkedin", "instagram", "facebook", "whatsapp", "phone", "email"];
      await tx.coachLink.deleteMany({ where: { coachProfileId, type: { in: allowedTypes } } });
      const toCreate = allowedTypes
        .map((type) => ({ type, value: input.links?.[type]?.trim() || "" }))
        .filter((item) => item.value);
      if (toCreate.length) {
        await tx.coachLink.createMany({
          data: toCreate.map((item) => ({
            coachProfileId,
            type: item.type,
            value: item.value,
            isPrimary: item.type === "whatsapp" || item.type === "email",
          })),
          skipDuplicates: true,
        });
      }
    }

    if (input.galleryUrls) {
      await tx.coachGalleryAsset.deleteMany({ where: { coachProfileId } });
      const urls = input.galleryUrls.map((u) => u.trim()).filter(Boolean).slice(0, 8);
      if (urls.length) {
        await tx.coachGalleryAsset.createMany({
          data: urls.map((url, index) => ({
            coachProfileId,
            url,
            sortOrder: index,
          })),
        });
      }
    }
  });

  return prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    include: {
      location: true,
      pricing: true,
      links: true,
      galleryAssets: { orderBy: { sortOrder: "asc" } },
      sessionModes: true,
      subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
}

function isSubscriptionStatusActiveish(status?: string | null) {
  return status === "active" || status === "trialing";
}

export async function publishCoachProfile(sessionUser: SessionUser, input?: { coachProfileId?: string }) {
  const coachProfileId = await ensureOwnedCoachProfile(sessionUser, input?.coachProfileId);

  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    include: {
      subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
      pricing: true,
    },
  });
  if (!profile) throw new Error("Perfil no encontrado");

  if (!profile.name?.trim()) throw new Error("Completa el nombre del perfil");
  if (!(profile.bio?.trim() || profile.aboutHtml?.trim())) throw new Error("Completa la seccion Sobre mi");
  if (!profile.pricing?.basePriceEur) throw new Error("Completa el precio base");

  const sub = profile.subscriptions[0];
  if (!sub || !isSubscriptionStatusActiveish(sub.status)) {
    throw new Error("Necesitas una membresia activa para publicar el perfil");
  }

  const published = await prisma.coachProfile.update({
    where: { id: coachProfileId },
    data: {
      profileStatus: "published",
      visibilityStatus: "active",
      publishedAt: profile.publishedAt ?? new Date(),
    },
    include: {
      location: true,
      pricing: true,
      links: true,
      galleryAssets: { orderBy: { sortOrder: "asc" } },
      sessionModes: true,
      subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  return published;
}

export async function canManageCoachProfile(sessionUser: SessionUser, coachProfileId: string) {
  if (sessionUser.role === "admin") return true;
  const profile = await prisma.coachProfile.findUnique({ where: { id: coachProfileId }, select: { userId: true } });
  return Boolean(profile && profile.userId === sessionUser.id);
}

export function roleCanEditCoachProfile(role: UserRole) {
  return role === "coach" || role === "admin";
}

