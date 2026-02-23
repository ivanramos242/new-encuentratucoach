import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { markNotificationRead } from "@/lib/v2-service";

type ParamsInput = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const actor = getMockActorFromRequest(request, "client");
  const { id } = await params;
  const result = markNotificationRead(actor, id);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, notification: result.notification });
}
