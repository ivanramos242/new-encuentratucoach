import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { createConversationReport } from "@/lib/v2-service";

const schema = z.object({
  threadId: z.string().min(1),
  messageId: z.string().min(1).optional(),
  reason: z.string().min(3).max(160),
  details: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const actorResolved = await resolveApiActorFromRequest(request, "client");
  if (!actorResolved.ok) return actorResolved.response;
  const actor = actorResolved.actor;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload invalido", 400, { issues: parsed.error.flatten() });

    const result = createConversationReport({ actor, ...parsed.data });
    if ("error" in result) return jsonError(String(result.error), 403);
    return jsonOk({
      actor,
      report: result.report,
      message: "Reporte registrado y enviado a moderacion admin.",
    });
  } catch {
    return jsonError("No se pudo reportar la conversacion", 400);
  }
}

