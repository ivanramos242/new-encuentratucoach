import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { listNotificationPreferences, upsertNotificationPreferences } from "@/lib/v2-service";

const itemSchema = z.object({
  type: z.enum([
    "message_new",
    "message_reply",
    "message_thread_reported",
    "qa_question_answered",
    "qa_answer_accepted",
    "qa_content_reported",
    "qa_content_moderated",
    "review_new_pending",
    "review_coach_action_required",
    "subscription_state_changed",
    "system_announcement",
  ]),
  channel: z.enum(["in_app", "email"]),
  enabled: z.boolean(),
});

const schema = z.object({
  items: z.array(itemSchema).min(1),
});

export async function GET(request: Request) {
  const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
  return jsonOk({
    actor,
    preferences: listNotificationPreferences(actor),
  });
}

export async function POST(request: Request) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });
    const preferences = upsertNotificationPreferences(actor, parsed.data.items);
    return jsonOk({
      actor,
      preferences,
      message: "Preferencias actualizadas (mock V2).",
    });
  } catch {
    return jsonError("No se pudieron guardar las preferencias", 400);
  }
}


