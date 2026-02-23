export type MockActorRole = "admin" | "coach" | "client";

export interface MockActor {
  role: MockActorRole;
  userId: string;
  displayName: string;
  coachProfileId?: string;
}

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

