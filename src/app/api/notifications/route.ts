import { jsonOk } from "@/lib/api-handlers";
import { getMockActorFromRequest } from "@/lib/mock-auth-context";
import { listNotifications } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actor = getMockActorFromRequest(request, "client");
  const items = listNotifications(actor);
  return jsonOk({
    actor,
    notifications: items,
    unreadCount: items.filter((item) => !item.isRead).length,
  });
}

