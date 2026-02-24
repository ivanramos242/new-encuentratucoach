import { jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { readAllNotifications } from "@/lib/v2-service";

export async function POST(request: Request) {
  const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  const result = readAllNotifications(actor);
  return jsonOk({ actor, ...result });
}


