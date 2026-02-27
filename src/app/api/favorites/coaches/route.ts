import { z } from "zod";
import { jsonError, jsonOk, jsonServerError } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { listFavoriteCoachIdsForUser, setFavoriteCoachForUser } from "@/lib/favorites-service";

const payloadSchema = z.object({
  coachProfileId: z.string().min(1),
  favorite: z.boolean(),
});

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["client", "admin"]);
  if (!auth.ok) return auth.response;

  try {
    const ids = await listFavoriteCoachIdsForUser(auth.user.id);
    return jsonOk({ favoriteCoachIds: ids });
  } catch (error) {
    return jsonServerError("No se pudieron cargar los favoritos", error);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiRole(request, ["client", "admin"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) return jsonError("Payload inválido", 400, { issues: parsed.error.flatten() });

    const result = await setFavoriteCoachForUser({
      userId: auth.user.id,
      coachProfileId: parsed.data.coachProfileId,
      favorite: parsed.data.favorite,
    });

    if (!result.ok) {
      if (result.code === "NOT_FOUND") return jsonError(result.message, 404);
      return jsonError(result.message, 403);
    }

    const ids = await listFavoriteCoachIdsForUser(auth.user.id);
    return jsonOk({ favoriteCoachIds: ids });
  } catch (error) {
    return jsonServerError("No se pudo actualizar favoritos", error);
  }
}
