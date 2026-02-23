import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { getPlatformFunnel } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actor = getMockActorFromRequest(request, "admin");
  if (actor.role !== "admin") return jsonError("Solo admin", 403);
  return jsonOk({
    actor,
    summary: getPlatformFunnel(),
  });
}

