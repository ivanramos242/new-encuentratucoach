import { jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { pollNotifications } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  const since = new URL(request.url).searchParams.get("since");
  const result = pollNotifications(actor, since);
  return jsonOk({
    actor,
    ...result,
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
  });
}


