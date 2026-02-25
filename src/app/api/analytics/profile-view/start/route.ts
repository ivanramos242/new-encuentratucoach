import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api-handlers";

const schema = z.object({
  coachId: z.string().min(1),
  sessionId: z.string().min(1),
  startedAt: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return jsonError("Payload inválido", 400);

    return jsonOk({
      status: "captured",
      event: "profile-view-start",
      coachId: parsed.data.coachId,
      sessionId: parsed.data.sessionId,
    });
  } catch {
    return jsonError("No se pudo registrar la visita", 400);
  }
}

