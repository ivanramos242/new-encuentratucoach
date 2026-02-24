import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { recordFunnelEvent } from "@/lib/v2-service";

const schema = z.object({
  coachProfileId: z.string().min(1).optional(),
  eventType: z.enum([
    "profile_view",
    "profile_cta_click",
    "chat_thread_started",
    "chat_first_coach_reply",
    "chat_client_followup",
    "qa_question_view",
    "qa_question_created",
    "qa_answer_created",
    "qa_answer_accepted",
    "review_created",
    "review_approved",
  ]),
  sourcePath: z.string().max(300).optional(),
  attribution: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const event = recordFunnelEvent({
      actor,
      coachProfileId: parsed.data.coachProfileId,
      eventType: parsed.data.eventType,
      sourcePath: parsed.data.sourcePath,
      attribution: parsed.data.attribution,
    });

    return jsonOk({ actor, event, status: "captured" });
  } catch {
    return jsonError("No se pudo registrar el funnel event", 400);
  }
}


