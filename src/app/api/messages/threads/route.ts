import { jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { listThreadsForActor } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actor = getMockActorFromRequest(request, "client");
  const threads = listThreadsForActor(actor);
  return jsonOk({
    actor,
    threads,
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
  });
}

