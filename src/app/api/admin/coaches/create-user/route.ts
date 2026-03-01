import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { createCoachUserByAdmin } from "@/lib/auth-service";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  displayName: z.string().max(120).optional(),
});

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

    const created = await createCoachUserByAdmin({
      email: parsed.data.email,
      displayName: parsed.data.displayName,
    });

    if ("error" in created) {
      return jsonError(created.error || "No se pudo crear el usuario coach", created.code === "EMAIL_EXISTS" ? 409 : 400);
    }

    return jsonOk({
      message: created.reset.delivered
        ? "Usuario coach creado. Se envio email de recuperacion para establecer contrasena."
        : "Usuario coach creado. Debe usar 'Recuperar contrasena' para establecerla.",
      user: {
        id: created.user.id,
        email: created.user.email,
        displayName: created.user.displayName,
        role: created.user.role,
        isActive: created.user.isActive,
        mustResetPassword: created.user.mustResetPassword,
        coachProfiles: [],
      },
      resetEmailDelivered: created.reset.delivered,
      debugResetUrl: created.reset.debugResetUrl,
    });
  } catch (error) {
    console.error("[admin/coaches/create-user] error", error);
    return jsonError("No se pudo crear el usuario coach", 500);
  }
}
