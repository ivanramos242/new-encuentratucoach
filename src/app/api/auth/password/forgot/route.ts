import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { createPasswordResetRequest } from "@/lib/auth-service";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Email inválido", 400, { issues: parsed.error.flatten() });

    const result = await createPasswordResetRequest(parsed.data.email);
    return jsonOk({
      message: "Si el email existe, recibirás instrucciones para recuperar la contraseña.",
      delivered: result.delivered,
      debugResetUrl: result.debugResetUrl,
    });
  } catch (error) {
    console.error("[auth/password/forgot] error", error);
    return jsonError("No se pudo procesar la solicitud", 400);
  }
}


