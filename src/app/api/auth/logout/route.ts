import { NextResponse } from "next/server";
import { clearSessionCookie, deleteSessionByRequest } from "@/lib/auth-session";

export async function POST(request: Request) {
  await deleteSessionByRequest(request).catch(() => undefined);
  const response = NextResponse.json({ ok: true, message: "Sesión cerrada" });
  clearSessionCookie(response);
  return response;
}

