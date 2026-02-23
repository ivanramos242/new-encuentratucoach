import { jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { readAllNotifications } from "@/lib/v2-service";

export async function POST(request: Request) {
  const actor = getMockActorFromRequest(request, "client");
  const result = readAllNotifications(actor);
  return jsonOk({ actor, ...result });
}

