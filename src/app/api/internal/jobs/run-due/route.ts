import { jsonOk } from "@/lib/api-handlers";
import { requireInternalCronSecret } from "@/lib/internal-security";
import { getJobsSnapshot, getJobRunLogs, runDueJobs } from "@/lib/job-queue-service";
import { runPendingMessageReminderSweep } from "@/lib/notification-workflows";

export async function POST(request: Request) {
  const authError = requireInternalCronSecret(request);
  if (authError) return authError;

  const reminderSummary = await runPendingMessageReminderSweep();
  const summary = await runDueJobs();
  return jsonOk({
    reminderSummary,
    summary,
    jobs: await getJobsSnapshot({ limit: 100 }),
    runLogs: await getJobRunLogs({ limit: 20 }),
  });
}
