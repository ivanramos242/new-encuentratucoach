import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { markNotificationRead } from "@/lib/v2-service";

type ParamsInput = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  const { id } = await params;
  const result = markNotificationRead(actor, id);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, notification: result.notification });
}
