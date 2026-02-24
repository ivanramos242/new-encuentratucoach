import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resetPasswordWithToken } from "@/lib/auth-service";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
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



