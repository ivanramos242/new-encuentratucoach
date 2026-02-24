import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { deleteObjectFromStorage, parsePublicObjectUrl } from "@/lib/s3-storage";

const schema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  try {
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
    return jsonError(error instanceof Error ? error.message : "No se pudo eliminar el archivo", 500);
  }
}
