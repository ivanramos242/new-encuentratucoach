import { z } from "zod";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-handlers";
import { registerUser, loginUser } from "@/lib/auth-service";
import { applySessionCookie } from "@/lib/auth-session";
import { applyEndpointRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(2).max(120).optional(),
});

export async function POST(request: Request) {
  try {
    const rateLimited = applyEndpointRateLimit(request, {
      namespace: "auth-register-client",
      limit: 8,
      windowMs: 10 * 60_000,
      message: "Demasiados registros desde esta IP. Espera unos minutos.",
    });
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Datos inválidos", 400, { issues: parsed.error.flatten() });

    const created = await registerUser({ ...parsed.data, role: "client" });
    if ("error" in created) return jsonError(String(created.error), 409);

    const login = await loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });
    if ("error" in login) return jsonError(String(login.error), 500);

    const response = NextResponse.json({
      ok: true,
      message: "Cuenta de cliente creada",
      user: login.user,
    });
    applySessionCookie(response, login.session.rawToken, login.session.expiresAt);
    return response;
  } catch (error) {
    console.error("[auth/register/client] unexpected error", error);
    return jsonError("No se pudo crear la cuenta. Revisa los logs del servidor.", 400);
  }
}


