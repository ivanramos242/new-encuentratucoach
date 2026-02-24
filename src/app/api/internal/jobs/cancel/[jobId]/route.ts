import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { cancelJob } from "@/lib/v2-service";

type ParamsInput = Promise<{ jobId: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const actorResolved = await resolveApiActorFromRequest(request, "admin");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  if (actor.role !== "admin") return jsonError("Solo admin puede cancelar jobs", 403);
  const { jobId } = await params;
  const result = cancelJob(jobId);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({ actor, job: result.job });
}
