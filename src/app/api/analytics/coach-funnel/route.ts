import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getCoachFunnel } from "@/lib/v2-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const coachProfileId = url.searchParams.get("coachProfileId");
  if (!coachProfileId) return jsonError("coachProfileId es obligatorio", 400);
  return jsonOk({
    coachProfileId,
    summary: getCoachFunnel(coachProfileId),
  });
}

