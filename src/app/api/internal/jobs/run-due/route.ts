import { jsonOk } from "@/lib/api-handlers";
import { requireInternalCronSecret } from "@/lib/internal-security";
import { getJobsSnapshot, getJobRunLogs, runDueJobs } from "@/lib/v2-service";

export async function POST(request: Request) {
  const authError = requireInternalCronSecret(request);
  if (authError) return authError;

  const summary = runDueJobs();
  return jsonOk({
    summary,
    jobs: getJobsSnapshot(),
    runLogs: getJobRunLogs().slice(0, 10),
  });
}

