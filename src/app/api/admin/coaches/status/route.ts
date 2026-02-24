import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const bodySchema = z.object({
  coachProfileId: z.string().min(1),
  action: z.enum(["draft"]),
});

function asLegacyRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
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

    const { coachProfileId, action } = parsed.data;

    const existing = await prisma.coachProfile.findUnique({
      where: { id: coachProfileId },
      select: { id: true },
    });
    if (!existing) return jsonError("Perfil de coach no encontrado", 404);

    const updated = await prisma.coachProfile.update({
      where: { id: coachProfileId },
      data:
        action === "draft"
          ? {
              profileStatus: "draft",
              visibilityStatus: "inactive",
            }
          : {},
      select: {
        id: true,
        name: true,
        slug: true,
        profileStatus: true,
        visibilityStatus: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    const legacy = await prisma.legacyImportMap.findFirst({
      where: {
        targetTable: "CoachProfile",
        targetId: coachProfileId,
        sourceType: "coach_post",
      },
      select: {
        sourceId: true,
        payload: true,
      },
    });

    const payload = asLegacyRecord(legacy?.payload);

    return jsonOk({
      message: "Coach pasado a draft (oculto del directorio).",
      coach: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        profileStatus: updated.profileStatus,
        visibilityStatus: updated.visibilityStatus,
        updatedAtIso: updated.updatedAt.toISOString(),
        owner: updated.owner
          ? {
              id: updated.owner.id,
              email: updated.owner.email,
              displayName: updated.owner.displayName,
              role: updated.owner.role,
              isActive: updated.owner.isActive,
            }
          : null,
        legacy: legacy
          ? {
              wpPostId:
                (typeof payload?.wpPostId === "number" ? String(payload.wpPostId) : null) ??
                (typeof payload?.wpPostId === "string" ? payload.wpPostId : null) ??
                legacy.sourceId,
              wpPostAuthor:
                typeof payload?.wpPostAuthor === "number"
                  ? String(payload.wpPostAuthor)
                  : typeof payload?.wpPostAuthor === "string"
                    ? payload.wpPostAuthor
                    : null,
              wpStatus: typeof payload?.wpStatus === "string" ? payload.wpStatus : null,
              sourceEmail:
                typeof payload?.sourceEmail === "string" ? payload.sourceEmail.trim().toLowerCase() : null,
              sourceUserIdField:
                typeof payload?.sourceUserIdField === "number"
                  ? String(payload.sourceUserIdField)
                  : typeof payload?.sourceUserIdField === "string"
                    ? payload.sourceUserIdField
                    : null,
              wpPermalink: typeof payload?.wpPermalink === "string" ? payload.wpPermalink : null,
            }
          : null,
        suggestedUserId: null,
        suggestedUserLabel: null,
      },
    });
  } catch (error) {
    console.error("[admin/coaches/status] error", error);
    return jsonError("No se pudo actualizar el estado del coach", 500);
  }
}
