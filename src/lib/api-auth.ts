import type { UserRole } from "@prisma/client";
import { forbidden, unauthorized } from "@/lib/api-handlers";
import { getSessionUserFromRequest, type SessionUser } from "@/lib/auth-session";

type ApiAuthOk = { ok: true; user: SessionUser };
type ApiAuthErr = { ok: false; response: Response };

export async function requireApiSession(request: Request): Promise<ApiAuthOk | ApiAuthErr> {
  const user = await getSessionUserFromRequest(request);
  if (!user) return { ok: false, response: unauthorized("Debes iniciar sesion.") };
  return { ok: true, user };
}

export async function requireApiRole(
  request: Request,
  roles: UserRole | UserRole[],
): Promise<ApiAuthOk | ApiAuthErr> {
  const session = await requireApiSession(request);
  if (!session.ok) return session;
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.user.role)) {
    return { ok: false, response: forbidden("No tienes permisos para esta accion.") };
  }
  return session;
}

