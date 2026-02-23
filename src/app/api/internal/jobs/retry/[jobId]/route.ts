import { jsonError, jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { retryJob } from "@/lib/v2-service";

type ParamsInput = Promise<{ jobId: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const actor = getMockActorFromRequest(request, "admin");
  if (actor.role !== "admin") return jsonError("Solo admin puede reintentar jobs", 403);
  const { jobId } = await params;
  const result = retryJob(jobId);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, job: result.job });
}
