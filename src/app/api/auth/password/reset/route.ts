import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resetPasswordWithToken } from "@/lib/auth-service";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "auth-password-reset",
      limit: 10,
      windowMs: 15 * 60_000,
      message: "Demasiados intentos de restablecimiento. Inténtalo más tarde.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Datos inválidos", 400, { issues: parsed.error.flatten() });

    const result = await resetPasswordWithToken({
      token: parsed.data.token,
      newPassword: parsed.data.password,
    });
    if ("error" in result) return jsonError(String(result.error), 400);

    return jsonOk({ message: "Contraseña actualizada correctamente." });
  } catch {
    return jsonError("No se pudo restablecer la contraseña", 400);
  }
}



