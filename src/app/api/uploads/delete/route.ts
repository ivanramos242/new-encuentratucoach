import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { deleteObjectFromStorage, parsePublicObjectUrl } from "@/lib/s3-storage";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  url: z.string().url(),
  coachProfileId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "uploads-delete",
      limit: 20,
      windowMs: 60_000,
    });
    if (rateLimited) return rateLimited;

    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    let bucket: string;
    let key: string;
    try {
      ({ bucket, key } = parsePublicObjectUrl(parsed.data.url));
    } catch {
      // Legacy/external URL: do not fail. Caller can still detach it from profile.
      return jsonOk({
        message: "URL externa o no gestionada por este storage. Se omite borrado fisico.",
        skipped: true,
      });
    }
    const requestedCoachProfileId = parsed.data.coachProfileId?.trim() || undefined;
    let effectiveCoachProfileId = requestedCoachProfileId || auth.user.coachProfileId || null;

    if (auth.user.role !== "admin") {
      if (!effectiveCoachProfileId) {
        return jsonError("No se pudo resolver el perfil de coach", 400);
      }

      // Trust the profile being edited when provided, but enforce ownership.
      if (requestedCoachProfileId) {
        const owned = await prisma.coachProfile.findFirst({
          where: {
            id: requestedCoachProfileId,
            userId: auth.user.id,
          },
          select: { id: true },
        });
        if (!owned) return jsonError("No puedes operar sobre un perfil de otro usuario", 403);
        effectiveCoachProfileId = owned.id;
      }
    }

    const isCoachMedia = key.startsWith("coach-media/");
    const isBlogMedia = key.startsWith("blog-media/");
    if (!isCoachMedia && !isBlogMedia) {
      return jsonOk({
        message: "Objeto fuera de los prefijos gestionados. Se omite borrado fisico.",
        skipped: true,
      });
    }

    if (isBlogMedia && auth.user.role !== "admin") {
      return jsonError("Solo admin puede borrar media del blog", 403);
    }

    if (isCoachMedia && auth.user.role !== "admin") {
      const expectedPrefix = `coach-media/${effectiveCoachProfileId}/`;
      if (!key.startsWith(expectedPrefix)) {
        // Fallback for migrated/legacy media: allow deletion only if this exact URL is linked
        // to the profile being edited and owned by the current coach user.
        const linked = await prisma.coachProfile.findFirst({
          where: {
            id: effectiveCoachProfileId || undefined,
            userId: auth.user.id,
            OR: [
              { heroImageUrl: parsed.data.url },
              { videoPresentationUrl: parsed.data.url },
              { galleryAssets: { some: { url: parsed.data.url } } },
            ],
          },
          select: { id: true },
        });
        if (!linked) {
          return jsonError("No puedes borrar archivos de otro perfil", 403);
        }
      }
    }

    await deleteObjectFromStorage({ bucket, key });
    return jsonOk({ message: "Archivo eliminado", bucket, key });
  } catch (error) {
    console.error("[uploads/delete] error", error);
    return jsonServerError("No se pudo eliminar el archivo", error);
  }
}
