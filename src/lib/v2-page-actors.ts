import type { MockActor } from "@/lib/mock-auth-context";
import { resolvePageActorForRole } from "@/lib/mock-auth-context";

export const v2CoachActor: MockActor = {
  role: "coach",
  userId: "user-coach-1",
  displayName: "Cristina Torres dos Santos",
  coachProfileId: "coach-1",
};

export const v2ClientActor: MockActor = {
  role: "client",
  userId: "user-client-1",
  displayName: "Carlos Martinez",
};

export const v2AdminActor: MockActor = {
  role: "admin",
  userId: "user-admin-1",
  displayName: "Admin ETC",
};

export async function getV2CoachPageActor() {
  return resolvePageActorForRole("coach");
}

export async function getV2ClientPageActor() {
  return resolvePageActorForRole("client");
}

export async function getV2AdminPageActor() {
  return resolvePageActorForRole("admin");
}
