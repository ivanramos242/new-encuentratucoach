import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { publishCoachProfile } from "@/lib/coach-profile-service";

const schema = z.object({
  coachProfileId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["coach", "admin"]);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const profile = await publishCoachProfile(auth.user, parsed.data);
    return jsonOk({ profile, message: "Perfil publicado correctamente" });
  } catch (error) {
    console.error("[coach-profile/publish] error", error);
    const message = error instanceof Error ? error.message : "No se pudo publicar el perfil";
    return jsonError(message, /membresia activa/i.test(message) ? 402 : 400);
  }
}


