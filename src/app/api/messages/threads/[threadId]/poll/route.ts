import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { pollThreadMessages } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

export async function GET(request: Request, { params }: { params: ParamsInput }) {
  const actor = getMockActorFromRequest(request, "client");
  const { threadId } = await params;
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const result = pollThreadMessages({ threadId, actor, since });
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({
    actor,
    threadId: result.threadId,
    items: result.items,
    serverTime: result.serverTime,
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
  });
}
