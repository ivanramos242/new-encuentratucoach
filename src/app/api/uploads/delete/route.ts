import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { deleteObjectFromStorage, parsePublicObjectUrl } from "@/lib/s3-storage";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  url: z.string().url(),
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

    const { bucket, key } = parsePublicObjectUrl(parsed.data.url);
    const coachProfileId = auth.user.coachProfileId;
    if (!coachProfileId && auth.user.role !== "admin") {
      return jsonError("No se pudo resolver el perfil de coach", 400);
    }

    if (!key.startsWith("coach-media/")) {
      return jsonError("Solo se permite borrar archivos de media de coach", 400);
    }

    if (auth.user.role !== "admin") {
      const expectedPrefix = `coach-media/${coachProfileId}/`;
      if (!key.startsWith(expectedPrefix)) {
        return jsonError("No puedes borrar archivos de otro perfil", 403);
      }
    }

    await deleteObjectFromStorage({ bucket, key });
    return jsonOk({ message: "Archivo eliminado", bucket, key });
  } catch (error) {
    console.error("[uploads/delete] error", error);
    return jsonServerError("No se pudo eliminar el archivo", error);
  }
}
