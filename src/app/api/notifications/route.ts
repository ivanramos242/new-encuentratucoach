import { jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { listNotifications } from "@/lib/v2-service";

export async function GET(request: Request) {
  const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  const items = listNotifications(actor);
  return jsonOk({
    actor,
    notifications: items,
    unreadCount: items.filter((item) => !item.isRead).length,
  });
}


