import { z } from "zod";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-handlers";
import { loginUser } from "@/lib/auth-service";
import { applySessionCookie, clearImpersonationCookie } from "@/lib/auth-session";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "auth-login",
      limit: 12,
      windowMs: 10 * 60_000,
      message: "Demasiados intentos de inicio de sesion. Intentalo mas tarde.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Datos de acceso invalidos", 400, { issues: parsed.error.flatten() });

    const result = await loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    if ("error" in result) {
      const code = (result as { code?: string }).code;
      return jsonError(String(result.error), code === "PASSWORD_RESET_REQUIRED" ? 403 : 401, code ? { code } : undefined);
    }

    const response = NextResponse.json({
      ok: true,
      message: "Sesion iniciada",
      user: result.user,
    });
    applySessionCookie(response, result.session.rawToken, result.session.expiresAt);
    clearImpersonationCookie(response);
    return response;
  } catch {
    return jsonError("No se pudo iniciar sesion", 400);
  }
}
