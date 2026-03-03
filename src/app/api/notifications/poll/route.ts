import { jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { pollNotificationsForUser } from "@/lib/notification-service";

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["client", "coach", "admin"]);
  if (!auth.ok) return auth.response;
  const since = new URL(request.url).searchParams.get("since");
  const result = await pollNotificationsForUser(auth.user.id, since);
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    ...result,
    pollIntervalMs: Number(process.env.MESSAGE_POLL_INTERVAL_MS ?? 300_000),
  });
}

