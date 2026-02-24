import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { getPlatformFunnel } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actorResolved = await resolveApiActorFromRequest(request, "admin");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  if (actor.role !== "admin") return jsonError("Solo admin", 403);
  return jsonOk({
    actor,
    summary: getPlatformFunnel(),
  });
}


