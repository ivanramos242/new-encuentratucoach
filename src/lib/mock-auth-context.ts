import { jsonError } from "@/lib/api-handlers";
import type { SessionUser } from "@/lib/auth-session";
import { getSessionUserFromRequest, getSessionUserFromServerCookies } from "@/lib/auth-session";

export type MockActorRole = "admin" | "coach" | "client";

export interface MockActor {
  role: MockActorRole;
  userId: string;
  displayName: string;
  coachProfileId?: string;
}

type ResolveActorOk = { ok: true; actor: MockActor; source: "session" | "mock" };
type ResolveActorError = { ok: false; response: Response };

const roleDefaults: Record<MockActorRole, MockActor> = {
  admin: {
    role: "admin",
    userId: "user-admin-1",
    displayName: "Admin ETC",
  },
  coach: {
    role: "coach",
    userId: "user-coach-1",
    displayName: "Coach Demo",
    coachProfileId: "coach-1",
  },
  client: {
    role: "client",
    userId: "user-client-1",
    displayName: "Cliente Demo",
  },
};

function parseRole(input: string | null | undefined): MockActorRole | null {
  if (!input) return null;
  const value = input.trim().toLowerCase();
  if (value === "admin" || value === "coach" || value === "client") return value;
  return null;
}

function isDevMockBypassEnabled() {
  if (process.env.NODE_ENV !== "development") return false;
  const flag = String(process.env.DEV_AUTH_BYPASS ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes" || flag === "on";
}

function actorFromSessionUser(sessionUser: SessionUser): MockActor {
  // While V2 services still run on mock datasets, keep canonical ids per role so inbox/Q&A demos remain usable.
  // We preserve the real display name to make the UI feel consistent after login.
  if (sessionUser.role === "admin") {
    return {
      role: "admin",
      userId: roleDefaults.admin.userId,
      displayName: sessionUser.displayName || roleDefaults.admin.displayName,
    };
  }

  if (sessionUser.role === "coach") {
    return {
      role: "coach",
      userId: roleDefaults.coach.userId,
      displayName: sessionUser.displayName || roleDefaults.coach.displayName,
      coachProfileId: sessionUser.coachProfileId || roleDefaults.coach.coachProfileId,
    };
  }

  return {
    role: "client",
    userId: roleDefaults.client.userId,
    displayName: sessionUser.displayName || roleDefaults.client.displayName,
  };
}

export function getMockActorFromRequest(request: Request, fallbackRole: MockActorRole = "client"): MockActor {
  const url = new URL(request.url);
  const role =
    parseRole(request.headers.get("x-mock-role")) ??
    parseRole(url.searchParams.get("as")) ??
    fallbackRole;

  const base = roleDefaults[role];
  return {
    ...base,
    userId: request.headers.get("x-mock-user-id") ?? url.searchParams.get("userId") ?? base.userId,
    displayName: request.headers.get("x-mock-display-name") ?? url.searchParams.get("displayName") ?? base.displayName,
    coachProfileId:
      request.headers.get("x-mock-coach-profile-id") ?? url.searchParams.get("coachProfileId") ?? base.coachProfileId,
  };
}

export function roleIn(actor: MockActor, allowed: MockActorRole[]) {
  return allowed.includes(actor.role);
}

export async function resolveApiActorFromRequest(
  request: Request,
  fallbackRole: MockActorRole = "client",
): Promise<ResolveActorOk | ResolveActorError> {
  const sessionUser = await getSessionUserFromRequest(request);
  if (sessionUser) {
    return { ok: true, actor: actorFromSessionUser(sessionUser), source: "session" };
  }

  if (isDevMockBypassEnabled()) {
    return { ok: true, actor: getMockActorFromRequest(request, fallbackRole), source: "mock" };
  }

  return { ok: false, response: jsonError("Debes iniciar sesión para acceder a este recurso.", 401) };
}

export async function resolvePageActorForRole(role: MockActorRole): Promise<MockActor> {
  const sessionUser = await getSessionUserFromServerCookies();
  if (sessionUser) return actorFromSessionUser(sessionUser);

  if (isDevMockBypassEnabled()) {
    return { ...roleDefaults[role] };
  }

  // Private layouts should already protect these routes. This is a defensive fallback.
  return { ...roleDefaults[role] };
}
