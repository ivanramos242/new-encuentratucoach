import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().max(180).optional(),
});

async function uniqueCoachSlug(base: string) {
  const normalized = slugify(base) || "coach";
  let slug = normalized;
  let i = 2;
  while (true) {
    const existing = await prisma.coachProfile.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${normalized}-${i++}`;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, "admin");
    if (!auth.ok) return auth.response;

    let jsonBody: unknown;
    try {
      jsonBody = await request.json();
    } catch {
      return jsonError("JSON invalido", 400);
    }

    const parsed = bodySchema.safeParse(jsonBody);
    if (!parsed.success) return jsonError("Payload invalido", 400);

    const normalizedName = parsed.data.name.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2) {
      return jsonError("Nombre invalido", 400);
    }

    const rawSlug = parsed.data.slug?.trim() || null;
    const normalizedSlug = rawSlug ? slugify(rawSlug) : null;
    if (rawSlug && !normalizedSlug) {
      return jsonError("Slug invalido", 400);
    }

    const slug = await uniqueCoachSlug(normalizedSlug ?? normalizedName);

    const created = await prisma.coachProfile.create({
      data: {
        name: normalizedName,
        slug,
        profileStatus: "draft",
        visibilityStatus: "inactive",
        certifiedStatus: "none",
        messagingEnabled: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        profileStatus: true,
        visibilityStatus: true,
        updatedAt: true,
      },
    });

    return jsonOk({
      message: "Coach creado en borrador. Ya puedes asignarlo a un usuario.",
      coach: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        profileStatus: created.profileStatus,
        visibilityStatus: created.visibilityStatus,
        updatedAtIso: created.updatedAt.toISOString(),
        owner: null,
        legacy: null,
        suggestedUserId: null,
        suggestedUserLabel: null,
      },
    });
  } catch (error) {
    console.error("[admin/coaches/create] error", error);
    return jsonError("No se pudo crear el coach", 500);
  }
}
