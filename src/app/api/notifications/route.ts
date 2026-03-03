import { jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import { listNotificationsForUser } from "@/lib/notification-service";

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["client", "coach", "admin"]);
  if (!auth.ok) return auth.response;
  const items = await listNotificationsForUser(auth.user.id);
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    notifications: items,
    unreadCount: items.filter((item) => !item.isRead).length,
  });
}

