import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { markNotificationReadForUser } from "@/lib/notification-service";

type ParamsInput = Promise<{ id: string }>;

export async function POST(request: Request, { params }: { params: ParamsInput }) {
  const auth = await requireApiRole(request, ["client", "coach", "admin"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await markNotificationReadForUser({ userId: auth.user.id, notificationId: id });
  if ("error" in result) return jsonError(String(result.error), 404);
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    notification: result.notification,
  });
}
