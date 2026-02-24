import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";
import { resolveApiActorFromRequest } from "@/lib/mock-auth-context";
import { createQaReport } from "@/lib/v2-service";

const schema = z.object({
  targetType: z.enum(["question", "answer"]),
  targetId: z.string().min(1),
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

    const result = createQaReport({ actor, ...parsed.data });
    if ("error" in result) return jsonError(String(result.error), 400);
    return jsonOk({ actor, report: result.report, message: "Reporte Q&A registrado." });
  } catch {
    return jsonError("No se pudo registrar el reporte", 400);
  }
}

