import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { getThreadForActor } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

export async function GET(request: Request, { params }: { params: ParamsInput }) {
  const actor = getMockActorFromRequest(request, "client");
  const { threadId } = await params;
  const result = getThreadForActor(threadId, actor);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, thread: result.thread });
}
