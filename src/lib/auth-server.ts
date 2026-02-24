import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getSessionUserFromServerCookies, type SessionUser } from "@/lib/auth-session";

export async function getOptionalSessionUser() {
  return getSessionUserFromServerCookies();
}

export async function requireSessionUser(options?: { returnTo?: string }) {
  const user = await getSessionUserFromServerCookies();
  if (!user) {
    const returnTo = options?.returnTo ? `?returnTo=${encodeURIComponent(options.returnTo)}` : "";
    redirect(`/iniciar-sesion${returnTo}`);
  }
  return user;
}

export async function requireRole(required: UserRole | UserRole[], options?: { returnTo?: string }) {
  const user = (await requireSessionUser(options)) as SessionUser;
  const allowed = Array.isArray(required) ? required : [required];
  if (!allowed.includes(user.role)) {
    if (user.role === "admin") return user;
    if (user.role === "coach") redirect("/mi-cuenta/coach");
    redirect("/mi-cuenta/cliente");
  }
  return user;
}

