import { z } from "zod";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-handlers";
import { loginUser } from "@/lib/auth-service";
import { applySessionCookie } from "@/lib/auth-session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Datos de acceso inválidos", 400, { issues: parsed.error.flatten() });

    const result = await loginUser({
      email: parsed.data.email,
      password: parsed.data.password,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: request.headers.get("user-agent"),
    });

    if ("error" in result) return jsonError(String(result.error), 401);

    const response = NextResponse.json({
      ok: true,
      message: "Sesión iniciada",
      user: result.user,
    });
    applySessionCookie(response, result.session.rawToken, result.session.expiresAt);
    return response;
  } catch {
    return jsonError("No se pudo iniciar sesión", 400);
  }
}


