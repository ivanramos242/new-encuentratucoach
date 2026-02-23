import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { markThreadRead } from "@/lib/v2-service";

type ParamsInput = Promise<{ threadId: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const actor = getMockActorFromRequest(request, "client");
  const { threadId } = await params;
  const result = markThreadRead({ threadId, actor });
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, ...result });
}
