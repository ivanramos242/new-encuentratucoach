import { NextResponse } from "next/server";
import { forbidden, unauthorized } from "@/lib/api-handlers";
import { clearImpersonationCookie, getBaseSessionUserFromRequest } from "@/lib/auth-session";

export async function POST(request: Request) {
  const baseUser = await getBaseSessionUserFromRequest(request);
  if (!baseUser) return unauthorized("Debes iniciar sesion.");
  if (baseUser.role !== "admin") return forbidden("No tienes permisos para esta accion.");

  const response = NextResponse.json({ ok: true, message: "Impersonacion finalizada" });
  clearImpersonationCookie(response);
  return response;
}
