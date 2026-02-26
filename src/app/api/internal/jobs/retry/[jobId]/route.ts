import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { retryJob } from "@/lib/v2-service";

type ParamsInput = Promise<{ jobId: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const auth = await requireApiRole(request, "admin");
  if (!auth.ok) return auth.response;
  const { jobId } = await params;
  const result = retryJob(jobId);
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    job: result.job,
  });
}
