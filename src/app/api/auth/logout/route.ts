import { NextResponse } from "next/server";
import { clearImpersonationCookie, clearSessionCookie, deleteSessionByRequest } from "@/lib/auth-session";

export async function POST(request: Request) {
  await deleteSessionByRequest(request).catch(() => undefined);
  const response = NextResponse.json({ ok: true, message: "Sesion cerrada" });
  clearSessionCookie(response);
  clearImpersonationCookie(response);
  return response;
}
