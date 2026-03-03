import { jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { markAllNotificationsReadForUser } from "@/lib/notification-service";

export async function POST(request: Request) {
  const auth = await requireApiRole(request, ["client", "coach", "admin"]);
  if (!auth.ok) return auth.response;
  const result = await markAllNotificationsReadForUser(auth.user.id);
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    ...result,
  });
}

