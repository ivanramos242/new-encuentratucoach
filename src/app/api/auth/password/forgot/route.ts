import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { createPasswordResetRequest } from "@/lib/auth-service";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "auth-password-forgot",
      limit: 6,
      windowMs: 15 * 60_000,
      message: "Demasiadas solicitudes de recuperación. Inténtalo más tarde.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Email inválido", 400, { issues: parsed.error.flatten() });

    const result = await createPasswordResetRequest(parsed.data.email);
    return jsonOk({
      message: "Si el email existe, recibirás instrucciones para recuperar la contraseña.",
      ...(process.env.NODE_ENV !== "production"
        ? {
            delivered: result.delivered,
            debugResetUrl: result.debugResetUrl,
          }
        : {}),
    });
  } catch (error) {
    console.error("[auth/password/forgot] error", error);
    return jsonError("No se pudo procesar la solicitud", 400);
  }
}


