import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { requireApiRole } from "@/lib/api-auth";
import {
  NOTIFICATION_TYPES,
  getNotificationCatalog,
  listNotificationPreferencesForUser,
  upsertNotificationPreferencesForUser,
} from "@/lib/notification-service";

const itemSchema = z.object({
  type: z.enum(NOTIFICATION_TYPES),
  channel: z.enum(["in_app", "email"]),
  enabled: z.boolean(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
});

export async function GET(request: Request) {
  const auth = await requireApiRole(request, ["client", "coach", "admin"]);
  if (!auth.ok) return auth.response;
  const preferences = await listNotificationPreferencesForUser({
    userId: auth.user.id,
    role: auth.user.role,
  });
  return jsonOk({
    actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
    catalog: getNotificationCatalog(auth.user.role),
    preferences,
  });
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole(request, ["client", "coach", "admin"]);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });
    const preferences = await upsertNotificationPreferencesForUser({
      userId: auth.user.id,
      role: auth.user.role,
      items: parsed.data.items,
    });
    return jsonOk({
      actor: { role: auth.user.role, userId: auth.user.id, displayName: auth.user.displayName ?? auth.user.email },
      catalog: getNotificationCatalog(auth.user.role),
      preferences,
      message: "Preferencias actualizadas.",
    });
  } catch {
    return jsonError("No se pudieron guardar las preferencias", 400);
  }
}

