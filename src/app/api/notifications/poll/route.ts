import { jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { pollNotifications } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actor = getMockActorFromRequest(request, "client");
  const since = new URL(request.url).searchParams.get("since");
  const result = pollNotifications(actor, since);
  return jsonOk({
    actor,
    ...result,
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
  });
}

